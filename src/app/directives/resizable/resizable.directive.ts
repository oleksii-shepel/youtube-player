import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Renderer2,
  SimpleChanges,
  OnChanges
} from '@angular/core';

@Directive({
  selector: '[appResizable]',
  standalone: false
})
export class ResizableDirective implements OnInit, OnDestroy, OnChanges {
  @Input('appResizable') enabled: boolean = true;

  @Input() minSize = 100;
  @Input() maxSize = 1000;
  @Input() preserveAspectRatio = true;
  @Input() resizeHandleSize = 16;
  @Input() resizeHandleColor = 'rgba(0, 0, 0, 0.3)';

  private resizer?: HTMLElement;
  private isResizing = false;
  private mutationObserver?: MutationObserver;
  private mouseMoveListener?: (event: MouseEvent) => void;
  private mouseUpListener?: (event: MouseEvent) => void;

  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.initializeElementPosition();
    this.setInitialStyles();
    if (this.enabled) {
      this.enableResizing();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enabled'] && !changes['enabled'].firstChange) {
      if (this.enabled) {
        this.enableResizing();
      } else {
        this.disableResizing();
      }
    }
  }

  ngOnDestroy(): void {
    this.disableResizing();
  }

  private initializeElementPosition(): void {
    const host = this.el.nativeElement;
    const computedStyle = window.getComputedStyle(host);

    if (computedStyle.position === 'static') {
      this.renderer.setStyle(host, 'position', 'absolute');
      const rect = host.getBoundingClientRect();
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.renderer.setStyle(host, 'left', `${rect.left + scrollLeft}px`);
      this.renderer.setStyle(host, 'top', `${rect.top + scrollTop}px`);
    }
  }

  private setInitialStyles(): void {
    const host = this.el.nativeElement;
    this.renderer.setStyle(host, 'overflow', 'visible');
    this.renderer.setStyle(host, 'transform-origin', 'center center');
    this.renderer.setStyle(host, 'box-sizing', 'border-box');
  }

  private enableResizing(): void {
    this.createResizer();
    this.setupMutationObserver();
  }

  private disableResizing(): void {
    this.mutationObserver?.disconnect();
    this.removeGlobalListeners();
    if (this.resizer) {
      this.resizer.remove();
      this.resizer = undefined;
    }
  }

  private createResizer(): void {
    if (this.resizer) return;

    this.resizer = this.renderer.createElement('div');
    this.renderer.setAttribute(this.resizer, 'data-resize-handle', 'true');
    this.renderer.appendChild(this.el.nativeElement, this.resizer);

    this.renderer.setStyle(this.resizer, 'position', 'absolute');
    this.renderer.setStyle(this.resizer, 'width', `${this.resizeHandleSize}px`);
    this.renderer.setStyle(this.resizer, 'height', `${this.resizeHandleSize}px`);
    this.renderer.setStyle(this.resizer, 'right', '0');
    this.renderer.setStyle(this.resizer, 'bottom', '0');
    this.renderer.setStyle(this.resizer, 'z-index', '1000');
    this.renderer.setStyle(this.resizer, 'background', this.resizeHandleColor);
    this.renderer.setStyle(this.resizer, 'pointer-events', 'auto');
    this.renderer.setStyle(this.resizer, 'user-select', 'none');
    this.renderer.setStyle(this.resizer, 'cursor', 'nw-resize');

    this.renderer.listen(this.resizer, 'mousedown', (event: MouseEvent) => {
      this.onResizerMouseDown(event);
    });
  }

  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver(() => {
      this.renderer.setStyle(this.resizer, 'right', '0');
      this.renderer.setStyle(this.resizer, 'bottom', '0');
    });

    this.mutationObserver.observe(this.el.nativeElement, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  private addGlobalListeners(): void {
    this.mouseMoveListener = this.onDocumentMouseMove.bind(this);
    this.mouseUpListener = this.onDocumentMouseUp.bind(this);

    document.addEventListener('mousemove', this.mouseMoveListener!, { passive: false });
    document.addEventListener('mouseup', this.mouseUpListener!, { passive: false });
  }

  private removeGlobalListeners(): void {
    if (this.mouseMoveListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
    }
    if (this.mouseUpListener) {
      document.removeEventListener('mouseup', this.mouseUpListener);
    }
  }

  private onResizerMouseDown(event: MouseEvent): void {
    if (!this.enabled) return;

    event.preventDefault();
    event.stopPropagation();

    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();

    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = rect.width;
    this.startHeight = rect.height;

    this.isResizing = true;
    this.renderer.addClass(document.body, 'resizing-active');
    this.addGlobalListeners();
  }

  private onDocumentMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    event.preventDefault();
    event.stopPropagation();

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    let newWidth = this.startWidth + dx;
    let newHeight = this.startHeight + dy;

    if (this.preserveAspectRatio) {
      const ratio = this.startWidth / this.startHeight;
      newHeight = newWidth / ratio;
    }

    newWidth = Math.max(this.minSize, Math.min(this.maxSize, newWidth));
    newHeight = Math.max(this.minSize, Math.min(this.maxSize, newHeight));

    this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
    this.renderer.setStyle(this.el.nativeElement, 'height', `${newHeight}px`);
  }

  private onDocumentMouseUp(): void {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.renderer.removeClass(document.body, 'resizing-active');
    this.removeGlobalListeners();
  }
}
