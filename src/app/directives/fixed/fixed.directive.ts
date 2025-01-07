import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[fixed]',
  standalone: true
})
export class FixedDirective implements OnInit, OnDestroy {
  @Input() side: 'left' | 'right' | 'top' | 'bottom' | 'all' = 'top'; // Default position
  @Input() offset: number = 0; // Offset from the specified side

  private resizeObserver: ResizeObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.adjustPositionAndSize();

    // Set up ResizeObserver to watch for changes in the parent container
    const parentElement = this.el.nativeElement.parentElement;
    if (parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.adjustPositionAndSize());
      this.resizeObserver.observe(parentElement);
    }

    // Listen to window resize event for general adjustments
    window.addEventListener('resize', this.adjustPositionAndSize.bind(this));
  }

  ngOnDestroy(): void {
    // Clean up the ResizeObserver and window resize event listener
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    window.removeEventListener('resize', this.adjustPositionAndSize.bind(this));
  }

  private adjustPositionAndSize(): void {
    const element = this.el.nativeElement;
    const parentElement = this.el.nativeElement.parentElement;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (parentElement) {
      const parentRect = parentElement.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Default to the size of the parent element
      let width = parentRect.width;
      let height = parentRect.height;

      // Ensure the component stays within the viewport boundaries
      let top = element.top - parentRect.top;
      let left = element.left - parentRect.left;
      let right = viewportWidth - parentRect.right;
      let bottom = viewportHeight - parentRect.bottom;

      top = Math.max(0, Math.min(top, viewportHeight - height));
      left = Math.max(0, Math.min(left, viewportWidth - width));
      right = Math.max(0, Math.min(right, viewportWidth - width));
      bottom = Math.max(0, Math.min(bottom, viewportHeight - height));

      switch (this.side) {
        case 'top':
          this.renderer.setStyle(element, 'position', 'fixed');
          this.renderer.setStyle(element, 'top', `${this.offset}px`);
          this.renderer.setStyle(element, 'left', `${left}px`);
          this.renderer.setStyle(element, 'width', `${Math.min(width, viewportWidth - this.offset)}px`);
          this.renderer.setStyle(element, 'height', `${Math.min(height, viewportHeight - this.offset)}px`);
          break;
        case 'bottom':
          this.renderer.setStyle(element, 'position', 'fixed');
          this.renderer.setStyle(element, 'bottom', `${this.offset}px`);
          this.renderer.setStyle(element, 'left', `${left}px`);
          this.renderer.setStyle(element, 'width', `${Math.min(width, viewportWidth - this.offset)}px`);
          this.renderer.setStyle(element, 'height', `${Math.min(height, viewportHeight - this.offset)}px`);
          break;
        case 'left':
          this.renderer.setStyle(element, 'position', 'fixed');
          this.renderer.setStyle(element, 'top', `${top}px`);
          this.renderer.setStyle(element, 'left', `${this.offset}px`);
          this.renderer.setStyle(element, 'width', `${Math.min(width, viewportWidth - this.offset)}px`);
          this.renderer.setStyle(element, 'height', `${height}px`);
          break;
        case 'right':
          this.renderer.setStyle(element, 'position', 'fixed');
          this.renderer.setStyle(element, 'top', `${top}px`);
          this.renderer.setStyle(element, 'right', `${this.offset}px`);
          this.renderer.setStyle(element, 'width', `${Math.min(width, viewportWidth - this.offset)}px`);
          this.renderer.setStyle(element, 'height', `${height}px`);
          break;
        case 'all':
          this.renderer.setStyle(element, 'position', 'fixed');
          this.renderer.setStyle(element, 'top', `${top}px`);
          this.renderer.setStyle(element, 'left', `${left}px`);
          this.renderer.setStyle(element, 'right', `${right}px`);
          this.renderer.setStyle(element, 'bottom', `${bottom}px`);
          this.renderer.setStyle(element, 'width', `${Math.min(width, viewportWidth - this.offset * 2)}px`);
          this.renderer.setStyle(element, 'height', `${Math.min(height, viewportHeight - this.offset * 2)}px`);
          break;
      }
    }
  }
}
