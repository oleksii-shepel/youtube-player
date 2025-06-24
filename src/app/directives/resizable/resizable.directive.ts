import { map } from '@actioncrew/streamix';
import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  Input,
  OnInit,
  OnDestroy
} from '@angular/core';

@Directive({
  selector: '[appResizable]',
  standalone: false
})
export class ResizableDirective implements OnInit, OnDestroy {
  @Input() minSize = 100;
  @Input() maxSize = 1000;
  @Input() preserveAspectRatio = true;
  @Input() resizeHandleSize = 16;
  @Input() resizeHandleColor = 'rgba(0, 0, 0, 0.3)';

  private resizer!: HTMLElement;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private startLeft = 0;
  private startTop = 0;
  private isResizing = false;
  private mutationObserver?: MutationObserver;
  private mouseMoveListener?: (event: MouseEvent) => void;
  private mouseUpListener?: (event: MouseEvent) => void;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.initializeElementPosition();
    this.createResizer();
    this.setInitialStyles();
    this.setupMutationObserver();
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.removeGlobalListeners();
  }

  private initializeElementPosition(): void {
    const host = this.el.nativeElement;
    const computedStyle = window.getComputedStyle(host);

    // Only set position if it's not already positioned
    if (computedStyle.position === 'static') {
      this.renderer.setStyle(host, 'position', 'absolute');

      // Get the current position on screen before making it absolute
      const rect = host.getBoundingClientRect();
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Set position to maintain current visual position
      this.renderer.setStyle(host, 'left', `${rect.left + scrollLeft}px`);
      this.renderer.setStyle(host, 'top', `${rect.top + scrollTop}px`);
    }
  }

  private createResizer(): void {
    this.resizer = this.renderer.createElement('div');
    this.renderer.addClass(this.resizer, 'resizer');
    this.renderer.setAttribute(this.resizer, 'data-resize-handle', 'true');
    this.renderer.appendChild(this.el.nativeElement, this.resizer);
  }

  private setInitialStyles(): void {
    const host = this.el.nativeElement;

    // Host element styles
    this.renderer.setStyle(host, 'overflow', 'visible'); // Changed from hidden to allow resize handle
    this.renderer.setStyle(host, 'transform-origin', 'center center');
    this.renderer.setStyle(host, 'box-sizing', 'border-box');

    // Resizer handle styles
    this.renderer.setStyle(this.resizer, 'position', 'absolute');
    this.renderer.setStyle(this.resizer, 'width', `${this.resizeHandleSize}px`);
    this.renderer.setStyle(this.resizer, 'height', `${this.resizeHandleSize}px`);
    this.renderer.setStyle(this.resizer, 'right', '0');
    this.renderer.setStyle(this.resizer, 'bottom', '0');
    this.renderer.setStyle(this.resizer, 'cursor', 'nw-resize');
    this.renderer.setStyle(this.resizer, 'z-index', '1000');
    this.renderer.setStyle(this.resizer, 'background', 'transparent');
    this.renderer.setStyle(this.resizer, 'pointer-events', 'auto');
    this.renderer.setStyle(this.resizer, 'user-select', 'none');
  }

  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          this.positionResizeHandle();
        }
      });
    });

    this.mutationObserver.observe(this.el.nativeElement, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  private positionResizeHandle(): void {
    // Keep the handle positioned at the bottom-right corner
    this.renderer.setStyle(this.resizer, 'right', '0');
    this.renderer.setStyle(this.resizer, 'bottom', '0');
  }

  private addGlobalListeners(): void {
    this.mouseMoveListener = this.onDocumentMouseMove.bind(this);
    this.mouseUpListener = this.onDocumentMouseUp.bind(this);

    document.addEventListener('mousemove', this.mouseMoveListener, { passive: false });
    document.addEventListener('mouseup', this.mouseUpListener, { passive: false });
  }

  private removeGlobalListeners(): void {
    if (this.mouseMoveListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
      this.mouseMoveListener = undefined;
    }
    if (this.mouseUpListener) {
      document.removeEventListener('mouseup', this.mouseUpListener);
      this.mouseUpListener = undefined;
    }
  }

  private onDocumentMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    event.preventDefault();
    event.stopPropagation();

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    let newWidth: number;
    let newHeight: number;

    if (this.preserveAspectRatio) {
      // Use the larger delta to maintain aspect ratio
      const delta = Math.max(dx, dy);
      newWidth = Math.max(this.minSize, Math.min(this.maxSize, this.startWidth + delta));
      newHeight = (newWidth / this.startWidth) * this.startHeight;
    } else {
      newWidth = Math.max(this.minSize, Math.min(this.maxSize, this.startWidth + dx));
      newHeight = Math.max(this.minSize, Math.min(this.maxSize, this.startHeight + dy));
    }

    // Apply changes without adjusting position (let draggable handle positioning)
    const host = this.el.nativeElement;
    this.renderer.setStyle(host, 'width', `${newWidth}px`);
    this.renderer.setStyle(host, 'height', `${newHeight}px`);
  }

  private onDocumentMouseUp(event: MouseEvent): void {
    if (!this.isResizing) return;

    event.preventDefault();
    event.stopPropagation();

    this.isResizing = false;
    this.renderer.removeClass(document.body, 'resizing-active');
    this.removeGlobalListeners();
  }

  private onResizerMouseDown(event: MouseEvent): void {
    // Only handle if the target is specifically the resize handle
    if (event.target !== this.resizer) return;

    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();

    this.startWidth = rect.width;
    this.startHeight = rect.height;

    // Get current position from computed styles
    const computedStyle = window.getComputedStyle(host);
    this.startLeft = parseFloat(computedStyle.left) || 0;
    this.startTop = parseFloat(computedStyle.top) || 0;

    this.renderer.addClass(document.body, 'resizing-active');
    this.addGlobalListeners();
  }

  // Remove the @HostListener decorators and use direct event binding
  ngAfterViewInit(): void {
    // Bind mousedown directly to the resizer element to avoid conflicts
    this.renderer.listen(this.resizer, 'mousedown', (event: MouseEvent) => {
      this.onResizerMouseDown(event);
    });
  }
}
