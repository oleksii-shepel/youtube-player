import { Directive, ElementRef, EventEmitter, Input, Output, AfterViewInit, OnDestroy, NgZone, Renderer2, ViewContainerRef, EmbeddedViewRef, TemplateRef } from '@angular/core';
import { Gesture, GestureController } from '@ionic/angular';

@Directive({
  selector: '[appSwipeable]',
  standalone: false,
})
export class SwipeableDirective implements AfterViewInit, OnDestroy {
  @Input() halfSwipeThreshold: number = 80;
  @Input() deleteThreshold: number = 160;
  @Input() customDeleteTemplate: TemplateRef<any> | null = null;
  @Input() enableHapticFeedback: boolean = true;

  @Output() halfSwipe = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() swipeStart = new EventEmitter<void>();
  @Output() swipeEnd = new EventEmitter<void>();

  private gesture?: Gesture;
  private isGestureActive = false;
  private isDeleting = false;
  private swipeState: 'closed' | 'half' | 'delete' = 'closed';
  private currentTranslateX = 0;
  private deleteIndicatorRef: EmbeddedViewRef<any> | null = null;
  private deleteIndicatorEl: HTMLElement | null = null;

  // Enhanced visual feedback states
  private readonly SWIPE_STATES = {
    CLOSED: 'closed',
    HALF: 'half',
    DELETE: 'delete'
  } as const;

  private get contentEl(): HTMLElement | null {
    return this.el.nativeElement.querySelector('.sliding-content') || this.el.nativeElement;
  }

  private get actionsEl(): HTMLElement | null {
    return this.el.nativeElement.querySelector('.slide-actions');
  }

  constructor(
    private el: ElementRef,
    private gestureCtrl: GestureController,
    private zone: NgZone,
    private renderer: Renderer2,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngAfterViewInit(): void {
    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.setupElement();
      this.setupDeleteIndicator();
      this.setupSwipeGesture();
    }, 0);
  }

  ngOnDestroy(): void {
    this.gesture?.destroy();
    this.cleanupElements();
  }

  private setupElement(): void {
    if (!this.contentEl) {
      console.warn('SwipeableDirective: No content element found');
      return;
    }

    // Ensure the container has relative positioning
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');

    // Setup content element
    this.renderer.setStyle(this.contentEl, 'position', 'relative');
    this.renderer.setStyle(this.contentEl, 'z-index', '2');
    this.renderer.setStyle(this.contentEl, 'background', 'transparent');
    this.renderer.setStyle(this.contentEl, 'transition', 'none');
  }

  private setupDeleteIndicator(): void {
    // Clean up any existing indicator first
    this.cleanupDeleteIndicator();

    if (this.customDeleteTemplate) {
      this.deleteIndicatorRef = this.viewContainerRef.createEmbeddedView(this.customDeleteTemplate);
      this.deleteIndicatorEl = this.deleteIndicatorRef.rootNodes[0];
    } else {
      this.deleteIndicatorEl = this.createDefaultDeleteIndicator();
    }

    if (this.deleteIndicatorEl) {
      this.setupDeleteIndicatorStyles();
      this.renderer.insertBefore(this.el.nativeElement, this.deleteIndicatorEl, this.contentEl);
    }
  }

  private createDefaultDeleteIndicator(): HTMLElement {
    const indicator = this.renderer.createElement('div');
    this.renderer.addClass(indicator, 'swipe-delete-indicator');

    // Create clickable delete icon container
    const deleteContent = this.renderer.createElement('div');
    this.renderer.addClass(deleteContent, 'delete-content');

    const deleteButton = this.renderer.createElement('ion-button');
    this.renderer.setAttribute(deleteButton, 'fill', 'clear');
    this.renderer.setAttribute(deleteButton, 'size', 'medium');
    this.renderer.setAttribute(deleteButton, 'color', 'light');

    const icon = this.renderer.createElement('ion-icon');
    this.renderer.setAttribute(icon, 'name', 'trash');

    this.renderer.appendChild(deleteButton, icon);

    // Append
    this.renderer.appendChild(deleteButton, icon);
    this.renderer.appendChild(deleteContent, deleteButton);
    this.renderer.appendChild(indicator, deleteContent);

    // Handle click on delete
    this.renderer.listen(deleteButton, 'click', (event) => {
      event.stopPropagation(); // avoid triggering row click
      this.zone.run(() => this.performDelete());
    });

    // Inject internal styles
    const style = this.renderer.createElement('style');
    style.textContent = style.textContent = `
        .swipe-delete-indicator {
          border-radius: 8px;
          overflow: hidden;
        }

        .delete-content {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
          padding: 0 20px;
        }

        .delete-icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .delete-icon {
          color: white;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `;
    this.renderer.appendChild(indicator, style);

    return indicator;
  }

  private setupDeleteIndicatorStyles(): void {
    if (!this.deleteIndicatorEl) return;

    const styles: { [key: string]: string } = {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'flex-end',
      opacity: '0',
      transition: 'background-color 0.2s ease-out, opacity 0.3s ease-out',
      'z-index': '1',
      'pointer-events': 'auto',
      'border-radius': '8px'
    };

    this.applyStyles(this.deleteIndicatorEl, styles);
  }

  private setupSwipeGesture(): void {
    if (!this.contentEl) return;

    this.zone.runOutsideAngular(() => {
      this.gesture = this.gestureCtrl.create({
        el: this.contentEl!,
        threshold: 8,
        gestureName: 'swipeable-enhanced',
        direction: 'x',
        onStart: () => {
          if (this.isDeleting) return;
          this.isGestureActive = true;
          this.swipeStart.emit();

          // Disable transitions during gesture
          this.renderer.setStyle(this.contentEl!, 'transition', 'none');
          this.deleteIndicatorEl && this.renderer.setStyle(this.deleteIndicatorEl, 'transition', 'none');

          // Trigger haptic feedback
          if (this.enableHapticFeedback && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
        },
        onMove: (ev) => {
          if (!this.isGestureActive || this.isDeleting) return;

          // Only allow left swipe (negative deltaX)
          if (ev.deltaX > 0) return;

          const swipeDistance = Math.abs(ev.deltaX);
          const newTranslateX = Math.max(-this.el.nativeElement.offsetWidth, ev.deltaX);

          this.updateSwipeState(swipeDistance, Math.abs(ev.velocityX));
          this.updateVisualFeedback(newTranslateX, swipeDistance);
        },
        onEnd: (ev) => {
          if (!this.isGestureActive || this.isDeleting) return;

          this.isGestureActive = false;
          this.swipeEnd.emit();

          // Re-enable transitions
          this.renderer.setStyle(this.contentEl!, 'transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
          this.deleteIndicatorEl && this.renderer.setStyle(this.deleteIndicatorEl, 'transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');

          const swipeDistance = Math.abs(ev.deltaX);
          const velocity = Math.abs(ev.velocityX);

          if (ev.deltaX > 0) {
            this.resetToClosedState();
            return;
          }

          this.handleSwipeEnd(swipeDistance, velocity);
        }
      });

      this.gesture.enable(true);
    });
  }

  private updateSwipeState(distance: number, velocity: number): void {
    const previousState = this.swipeState;

    if (distance >= this.deleteThreshold) {
      this.swipeState = 'delete';
    } else if (distance >= this.halfSwipeThreshold) {
      this.swipeState = 'half';
    } else {
      this.swipeState = 'closed';
    }

    // Trigger haptic feedback on state change
    if (this.enableHapticFeedback && this.swipeState !== previousState && 'vibrate' in navigator) {
      if (this.swipeState === 'half') {
        navigator.vibrate(15);
      } else if (this.swipeState === 'delete') {
        navigator.vibrate([20, 10, 20]);
      }
    }
  }

  private updateVisualFeedback(translateX: number, swipeDistance: number): void {
    if (!this.contentEl || !this.deleteIndicatorEl) return;

    const isSwipingLeft = translateX < 0;
    const progress = Math.min(Math.abs(translateX) / this.halfSwipeThreshold, 1);

    this.zone.run(() => {
      this.renderer.setStyle(this.contentEl!, 'transform', `translateX(-100%)`);

      if (isSwipingLeft) {
        // Show the delete background
        this.renderer.setStyle(this.deleteIndicatorEl!, 'opacity', progress.toString());

        if (this.swipeState === 'delete') {
          this.renderer.setStyle(this.deleteIndicatorEl!, 'background', 'var(--ion-color-danger)');
          this.renderer.addClass(this.deleteIndicatorEl!, 'delete-ready');
        } else if (this.swipeState === 'half') {
          this.renderer.setStyle(this.deleteIndicatorEl!, 'background', 'var(--ion-color-danger)');
          this.renderer.removeClass(this.deleteIndicatorEl!, 'delete-ready');
        } else {
          this.renderer.setStyle(this.deleteIndicatorEl!, 'background', 'transparent');
          this.renderer.removeClass(this.deleteIndicatorEl!, 'delete-ready');
        }
      } else {
        // Swiping right – hide delete indicator completely
        this.renderer.setStyle(this.deleteIndicatorEl!, 'opacity', '0');
        this.renderer.setStyle(this.deleteIndicatorEl!, 'background', 'transparent');
        this.renderer.removeClass(this.deleteIndicatorEl!, 'delete-ready');
      }
    });
  }

  private handleSwipeEnd(distance: number, velocity: number): void {
    if (distance >= this.deleteThreshold) {
      this.performDelete();
    } else if (distance >= this.halfSwipeThreshold) {
      this.setHalfSwipeState();
    } else {
      this.resetToClosedState();
    }
  }

  private setHalfSwipeState(): void {
    this.swipeState = 'half';
    this.currentTranslateX = -this.halfSwipeThreshold;

    this.zone.run(() => {
      if (this.contentEl) {
        this.renderer.setStyle(this.contentEl, 'transform', `translateX(${this.currentTranslateX}px)`);
      }

      if (this.deleteIndicatorEl) {
        this.renderer.setStyle(this.deleteIndicatorEl, 'opacity', '1');
        this.renderer.setStyle(this.deleteIndicatorEl, 'background', 'var(--ion-color-danger)');
      }

      this.halfSwipe.emit();
    });
  }

  private resetToClosedState(): void {
    this.swipeState = 'closed';
    this.currentTranslateX = 0;

    this.zone.run(() => {
      if (this.contentEl) {
        this.renderer.setStyle(this.contentEl, 'transform', 'translateX(0)');
      }

      if (this.deleteIndicatorEl) {
        this.renderer.setStyle(this.deleteIndicatorEl, 'opacity', '0');
        this.renderer.setStyle(this.deleteIndicatorEl, 'background', 'transparent');
        this.renderer.removeClass(this.deleteIndicatorEl, 'delete-ready');
      }
    });
  }

  private performDelete(): void {
    if (!this.contentEl || this.isDeleting) return;

    this.isDeleting = true;

    this.zone.run(() => {
      // Haptic feedback for delete
      if (this.enableHapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate([30, 20, 30]);
      }

      this.renderer.setStyle(this.contentEl!, 'transition', 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)');
      this.renderer.setStyle(this.contentEl!, 'transform', `translateX(-100%)`);
      this.renderer.setStyle(this.contentEl!, 'opacity', '0');

      if (this.deleteIndicatorEl) {
        this.renderer.setStyle(this.deleteIndicatorEl, 'opacity', '1');
        this.renderer.addClass(this.deleteIndicatorEl, 'delete-ready');
      }
    });

    setTimeout(() => {
      this.zone.run(() => {
        this.delete.emit();
        this.reset();
      });
    }, 400);
  }

  private reset(): void {
    this.swipeState = 'closed';
    this.currentTranslateX = 0;
    this.isDeleting = false;

    if (this.contentEl) {
      this.renderer.setStyle(this.contentEl, 'transform', 'translateX(0)');
      this.renderer.setStyle(this.contentEl, 'opacity', '1');
      this.renderer.setStyle(this.contentEl, 'transition', 'none');
    }

    if (this.deleteIndicatorEl) {
      this.renderer.setStyle(this.deleteIndicatorEl, 'opacity', '0');
      this.renderer.setStyle(this.deleteIndicatorEl, 'background', 'var(--ion-color-medium, #92949c)');
      this.renderer.removeClass(this.deleteIndicatorEl, 'delete-ready');
    }
  }

  private applyStyles(element: HTMLElement, styles: { [key: string]: string }): void {
    Object.entries(styles).forEach(([property, value]) => {
      this.renderer.setStyle(element, property, value);
    });
  }

  private cleanupElements(): void {
    this.cleanupDeleteIndicator();
  }

  private cleanupDeleteIndicator(): void {
    if (this.deleteIndicatorRef) {
      this.deleteIndicatorRef.destroy();
      this.deleteIndicatorRef = null;
    }

    if (this.deleteIndicatorEl && this.deleteIndicatorEl.parentNode) {
      this.renderer.removeChild(this.deleteIndicatorEl.parentNode, this.deleteIndicatorEl);
    }

    this.deleteIndicatorEl = null;
  }

  // Public API
  public close(): void {
    if (this.swipeState === 'closed' || this.isDeleting) return;
    this.resetToClosedState();
  }

  public getSwipeState(): 'closed' | 'half' | 'delete' {
    return this.swipeState;
  }
}
