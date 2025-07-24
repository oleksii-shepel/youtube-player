// modal-resize-handle.directive.ts
import {
  Directive,
  ElementRef,
  AfterViewInit,
  Renderer2,
  NgZone,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[appModalResizeHandle]',
  standalone: true,
})
export class ModalResizeHandleDirective implements AfterViewInit, OnDestroy {
  private handleEl: HTMLElement | null = null;
  private startY = 0;
  private startHeight = 0;

  private moveListener?: () => void;
  private endListener?: () => void;

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private zone: NgZone
  ) {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      // Access the modal's shadow DOM
      const modal = this.elRef.nativeElement;
       // Wait until shadowRoot is available
      const waitForShadowRoot = () => {
        if (modal.shadowRoot) {
          const observer = new MutationObserver(() => {
            this.handleEl = modal.shadowRoot?.querySelector('.modal-wrapper') as HTMLElement;
            if (this.handleEl) {
              this.renderer.listen(this.handleEl, 'touchstart', this.onTouchStart);
              observer.disconnect();
            }
          });

          observer.observe(modal.shadowRoot, { childList: true, subtree: true });
        } else {
          // Retry on next animation frame
          requestAnimationFrame(waitForShadowRoot);
        }
      };

      waitForShadowRoot();
    });
  }

  private onTouchStart = (e: TouchEvent) => {
    this.startY = e.touches[0].clientY;
    this.startHeight = this.elRef.nativeElement.offsetHeight;

    this.moveListener = this.renderer.listen('document', 'touchmove', this.onTouchMove, { passive: false } as any);
    this.endListener = this.renderer.listen('document', 'touchend', this.onTouchEnd);
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault(); // prevent page scroll
    const deltaY = e.touches[0].clientY - this.startY;
    const newHeight = this.startHeight - deltaY;

    // Limit height to sensible bounds if needed
    if (newHeight > 100) {
      this.elRef.nativeElement.style.setProperty('--height', `${newHeight}px`);
      this.elRef.nativeElement.style.height = `${newHeight}px`;
    }
  };

  private onTouchEnd = () => {
    this.moveListener?.();
    this.endListener?.();
  };

  ngOnDestroy() {
    this.moveListener?.();
    this.endListener?.();
  }
}
