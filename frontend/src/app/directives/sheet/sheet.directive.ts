import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Renderer2,
  HostListener,
  Inject,
  DOCUMENT
} from '@angular/core';

export interface SheetBreakpoint {
  id: string;
  height: number; // Height as percentage (0-100)
  isClosing?: boolean; // Whether this breakpoint closes the sheet
}

export interface SheetConfig {
  breakpoints: SheetBreakpoint[];
  initialBreakpoint?: string;
  backdropDismiss?: boolean;
  showBackdrop?: boolean;
  canDismiss?: boolean;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
}

@Directive({
  selector: '[appSheet]',
  exportAs: 'appSheetDirective',
  standalone: false
})
export class SheetDirective implements OnInit, OnDestroy {
  @Input() appSheet: SheetConfig = {
    breakpoints: [
      { id: 'small', height: 25 },
      { id: 'large', height: 75 }
    ],
    initialBreakpoint: 'small',
    backdropDismiss: true,
    showBackdrop: true,
    canDismiss: true
  };

  @Output() breakpointChange = new EventEmitter<SheetBreakpoint>();
  @Output() didDismiss = new EventEmitter<void>();
  @Output() willDismiss = new EventEmitter<void>();

  private modalContainer!: HTMLElement;
  private modalBackdrop!: HTMLElement;
  private currentBreakpoint!: SheetBreakpoint;
  private isDragging = false;
  private startY = 0;
  private startHeight = 0;
  private animationId: number | null = null;
  private rootElement: HTMLElement;

  private readonly ANIMATION_DURATION = 300;
  private readonly VELOCITY_THRESHOLD = 0.5;

  private touchStartListener?: () => void;
  private mouseDownListener?: () => void;
  private touchMoveListener?: () => void;
  private mouseMoveListener?: () => void;
  private touchEndListener?: () => void;
  private mouseUpListener?: () => void;
  private backdropClickListener?: () => void;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.rootElement = this.document.querySelector('ion-app') || this.document.body;
  }

  ngOnInit() {
    this.initializeSheet();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.touchStartListener?.();
    this.mouseDownListener?.();
    this.touchMoveListener?.();
    this.mouseMoveListener?.();
    this.touchEndListener?.();
    this.mouseUpListener?.();
    this.backdropClickListener?.();
  }

  private initializeSheet() {
    const element = this.elementRef.nativeElement;
    const parent = element.parentElement;

    if (!parent) {
      console.error('Sheet directive requires a parent element.');
      return;
    }

    // Find modal-backdrop and modal-container as siblings to the directive's host element
    this.modalBackdrop = parent.querySelector('.modal-backdrop') as HTMLElement;
    this.modalContainer = parent.querySelector('.modal-container') as HTMLElement;

    if (!this.modalBackdrop || !this.modalContainer) {
      console.error('Sheet directive requires .modal-backdrop and .modal-container elements as siblings.');
      return;
    }

    this.setupInitialStyles();

    const initialBreakpoint = this.appSheet.breakpoints.find(
      bp => bp.id === this.appSheet.initialBreakpoint
    ) || this.appSheet.breakpoints[0];

    // Do NOT set breakpoint here, it will be set by present()
    this.currentBreakpoint = initialBreakpoint; // Just store it for later

    this.setupEventListeners();
  }

  private setupInitialStyles() {
    // Backdrop styles (positioning and behavior)
    this.renderer.setStyle(this.modalBackdrop, 'position', 'fixed');
    this.renderer.setStyle(this.modalBackdrop, 'top', '0');
    this.renderer.setStyle(this.modalBackdrop, 'left', '0');
    this.renderer.setStyle(this.modalBackdrop, 'width', '100%');
    this.renderer.setStyle(this.modalBackdrop, 'height', '100%');
    this.renderer.setStyle(this.modalBackdrop, 'z-index', '1000'); // Ensure it's above other content

    // Container styles (positioning and behavior)
    this.renderer.setStyle(this.modalContainer, 'position', 'absolute');
    this.renderer.setStyle(this.modalContainer, 'margin', '0 auto'); // Center horizontally
    this.renderer.setStyle(this.modalContainer, 'bottom', '0');
    this.renderer.setStyle(this.modalContainer, 'left', '0');
    this.renderer.setStyle(this.modalContainer, 'right', '0');
    this.renderer.setStyle(this.modalContainer, 'z-index', '1001');
    this.renderer.setStyle(this.modalContainer, 'transform', 'translateY(100vh)');
    this.renderer.setStyle(this.modalContainer, 'transition', 'transform 0.3s ease');
    this.renderer.setStyle(this.modalContainer, 'display', 'flex');
    this.renderer.setStyle(this.modalContainer, 'flex-direction', 'column');

    // Add a class for initial hidden state that will be transitioned
    this.renderer.addClass(this.modalContainer, 'hidden');
    this.renderer.addClass(this.modalBackdrop, 'hidden');

    this.addDragHandle();
  }

  private addDragHandle() {
    const handle = this.renderer.createElement('div');
    this.renderer.addClass(handle, 'data-modal-resize-handle'); // Apply class for styling
    this.renderer.insertBefore(this.modalContainer, handle, this.modalContainer.firstChild);
  }

  private setupEventListeners() {
    if (this.appSheet.backdropDismiss) {
      this.backdropClickListener = this.renderer.listen(this.modalBackdrop, 'click', (event) => {
        if (event.target === this.modalBackdrop && this.appSheet.canDismiss) {
          this.dismiss();
        }
      });
    }

    this.touchStartListener = this.renderer.listen(this.modalContainer, 'touchstart', this.onDragStart.bind(this), { passive: false });
    this.mouseDownListener = this.renderer.listen(this.modalContainer, 'mousedown', this.onDragStart.bind(this));

    this.touchMoveListener = this.renderer.listen(document, 'touchmove', this.onDragMove.bind(this), { passive: false });
    this.mouseMoveListener = this.renderer.listen(document, 'mousemove', this.onDragMove.bind(this));

    this.touchEndListener = this.renderer.listen(document, 'touchend', this.onDragEnd.bind(this));
    this.mouseUpListener = this.renderer.listen(document, 'mouseup', this.onDragEnd.bind(this));
  }

  private onDragStart(event: TouchEvent | MouseEvent) {
    const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    const target = event.target as HTMLElement;

    const isFromHandle = target.classList.contains('data-modal-resize-handle');
    const isFromTopArea = clientY - this.modalContainer.getBoundingClientRect().top < 50;

    if (isFromHandle || isFromTopArea) {
      this.isDragging = true;
      this.startY = clientY;
      this.startHeight = this.modalContainer.offsetHeight;

      // Temporarily remove transitions during drag
      this.renderer.setStyle(this.modalContainer, 'transition', 'none');

      event.preventDefault();
    }
  }

  private onDragMove(event: TouchEvent | MouseEvent) {
    if (!this.isDragging) return;

    const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    const deltaY = clientY - this.startY;
    const viewportHeight = window.innerHeight;

    let newHeightPx = Math.max(0, this.startHeight - deltaY);

    const newHeightPercent = (newHeightPx / viewportHeight) * 100;

    const constrainedHeightPercent = Math.min(100, newHeightPercent);

    this.renderer.setStyle(this.modalContainer, 'height', `${constrainedHeightPercent}%`);

    event.preventDefault();
  }

  private onDragEnd(event: TouchEvent | MouseEvent) {
    if (!this.isDragging) return;

    this.isDragging = false;

    // Re-apply transitions after drag ends
    this.renderer.setStyle(this.modalContainer, 'transition', 'transform 300ms ease, height 300ms ease');

    const clientY = event instanceof TouchEvent ? event.changedTouches[0].clientY : event.clientY;
    const deltaY = clientY - this.startY;
    const velocity = Math.abs(deltaY) / this.ANIMATION_DURATION; // Simple velocity estimation

    const currentHeightPercent = (this.modalContainer.offsetHeight / window.innerHeight) * 100;

    const targetBreakpoint = this.findClosestBreakpoint(currentHeightPercent, deltaY > 0, velocity);

    if (targetBreakpoint.isClosing && this.appSheet.canDismiss) {
      this.dismiss();
    } else {
      this.setBreakpoint(targetBreakpoint, true);
    }
  }

  private findClosestBreakpoint(currentHeight: number, isDraggingDown: boolean, velocity: number): SheetBreakpoint {
    const sortedBreakpoints = [...this.appSheet.breakpoints].sort((a, b) => a.height - b.height);

    const snapBreakpoints = sortedBreakpoints.filter(bp => !bp.isClosing);

    // Prioritize velocity-based snapping if drag was fast enough
    if (velocity > this.VELOCITY_THRESHOLD) {
      const currentIndex = snapBreakpoints.findIndex(bp => bp.id === this.currentBreakpoint.id);

      if (isDraggingDown) {
        // If dragging down, try to snap to the next lower breakpoint
        if (currentIndex > 0) {
          return snapBreakpoints[currentIndex - 1];
        } else {
          // If no lower snap breakpoint, check for a closing breakpoint
          const closingBreakpoint = sortedBreakpoints.find(bp => bp.isClosing);
          if (closingBreakpoint) return closingBreakpoint;
        }
      } else {
        // If dragging up, try to snap to the next higher breakpoint
        if (currentIndex < snapBreakpoints.length - 1) {
          return snapBreakpoints[currentIndex + 1];
        }
      }
    }

    // Fallback to closest breakpoint if not fast enough or no next/previous breakpoint
    let closest = snapBreakpoints[0] || sortedBreakpoints[0];
    let minDistance = Math.abs(currentHeight - closest.height);

    for (const breakpoint of snapBreakpoints) {
      const distance = Math.abs(currentHeight - breakpoint.height);
      if (distance < minDistance) {
        minDistance = distance;
        closest = breakpoint;
      }
    }

    // Special case: if dragging down significantly below the lowest snap point
    if (isDraggingDown && currentHeight < (snapBreakpoints[0]?.height || 0) / 2 && this.appSheet.canDismiss) {
      const closingBreakpoint = sortedBreakpoints.find(bp => bp.isClosing);
      if (closingBreakpoint) return closingBreakpoint;
    }

    return closest;
  }

  private setBreakpoint(breakpoint: SheetBreakpoint, animate = true) {
    this.currentBreakpoint = breakpoint;

    if (!animate) {
      this.renderer.setStyle(this.modalContainer, 'transition', 'none');
    }

    this.renderer.setStyle(this.modalContainer, 'height', `${breakpoint.height}%`);
    // Ensure transform is reset to 0 when setting a breakpoint (bringing it into view)
    this.renderer.setStyle(this.modalContainer, 'transform', 'translateY(0)');

    if (!animate) {
      // Force reflow to apply 'none' before re-applying transition
      this.modalContainer.offsetHeight;
      this.renderer.setStyle(this.modalContainer, 'transition', 'transform 300ms ease, height 300ms ease');
    }

    this.breakpointChange.emit(breakpoint);
  }

  @HostListener('window:resize')
  onWindowResize() {
    // Re-apply current breakpoint height on resize to ensure responsiveness
    if (this.currentBreakpoint) {
      this.setBreakpoint(this.currentBreakpoint, false);
    }
  }

  present(): Promise<void> {
    return new Promise((resolve) => {
      // Show backdrop
      this.renderer.removeClass(this.modalBackdrop, 'hidden');
      this.renderer.addClass(this.modalBackdrop, 'visible'); // Add visible class for backdrop opacity

      // Animate container to its initial breakpoint height and position
      const initialBp = this.appSheet.breakpoints.find(bp => bp.id === this.appSheet.initialBreakpoint) || this.appSheet.breakpoints[0];
      this.renderer.removeClass(this.modalContainer, 'hidden'); // Remove hidden class to allow transition
      this.setBreakpoint(initialBp, true); // This will set height and transform: translateY(0)

      setTimeout(() => {
        resolve();
      }, this.ANIMATION_DURATION);
    });
  }

  dismiss(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.appSheet.canDismiss) return resolve();

      this.willDismiss.emit();

      // Animate container to fully hidden state (transformY(100vh)) and height: 0
      this.renderer.setStyle(this.modalContainer, 'transform', 'translateY(100vh)');
      this.renderer.setStyle(this.modalContainer, 'height', '0');

      // Hide backdrop opacity by removing visible class
      this.renderer.removeClass(this.modalBackdrop, 'visible');
      this.renderer.addClass(this.modalBackdrop, 'hidden');

      setTimeout(() => {
        // After animation, ensure pointer-events are disabled for backdrop
        this.renderer.setStyle(this.modalBackdrop, 'pointer-events', 'none');
        this.didDismiss.emit();
        resolve();
      }, this.ANIMATION_DURATION);
    });
  }

  setCurrentBreakpoint(breakpointId: string): void {
    const breakpoint = this.appSheet.breakpoints.find(bp => bp.id === breakpointId);
    if (breakpoint) {
      this.setBreakpoint(breakpoint, true);
    }
  }

  getCurrentBreakpoint(): SheetBreakpoint {
    return this.currentBreakpoint;
  }
}
