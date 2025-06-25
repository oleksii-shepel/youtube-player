import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  Renderer2,
  AfterViewInit
} from '@angular/core';

@Directive({
  selector: '[appDraggable]',
  standalone: false
})
export class DraggableDirective implements OnDestroy, AfterViewInit {
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;
  private movedDistance = 0;
  private readonly dragThreshold = 20;

  private mouseMoveListener?: (event: MouseEvent) => void;
  private mouseUpListener?: (event: MouseEvent) => void;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.initializeElement();
  }

  ngOnDestroy(): void {
    this.removeGlobalListeners();
  }

  private initializeElement(): void {
    const element = this.el.nativeElement;
    const computedStyle = window.getComputedStyle(element);

    if (computedStyle.position === 'static') {
      this.renderer.setStyle(element, 'position', 'absolute');

      const rect = element.getBoundingClientRect();
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      this.renderer.setStyle(element, 'left', `${rect.left + scrollLeft}px`);
      this.renderer.setStyle(element, 'top', `${rect.top + scrollTop}px`);
    }

    this.renderer.setStyle(element, 'cursor', 'default');
    this.renderer.setStyle(element, 'user-select', 'none');
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('resizer') ||
        target.hasAttribute('data-resize-handle') ||
        target.closest('[data-resize-handle]')) {
      return;
    }

    if (this.isInteractiveElement(target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.movedDistance = 0;

    const element = this.el.nativeElement;
    const computedStyle = window.getComputedStyle(element);
    this.initialLeft = parseFloat(computedStyle.left) || 0;
    this.initialTop = parseFloat(computedStyle.top) || 0;

    this.renderer.addClass(document.body, 'dragging-active');
    this.renderer.addClass(element, 'being-dragged');

    this.addGlobalListeners();
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'A'];
    const interactiveRoles = ['button', 'link', 'textbox'];

    return interactiveTags.includes(element.tagName) ||
           interactiveRoles.includes(element.getAttribute('role') || '') ||
           element.contentEditable === 'true' ||
           element.hasAttribute('tabindex');
  }

  private addGlobalListeners(): void {
    this.mouseMoveListener = this.onMouseMove.bind(this);
    this.mouseUpListener = this.onMouseUp.bind(this);

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

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    event.preventDefault();
    event.stopPropagation();

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    this.movedDistance = Math.sqrt(dx * dx + dy * dy);

    const newLeft = this.initialLeft + dx;
    const newTop = this.initialTop + dy;

    const element = this.el.nativeElement;
    this.renderer.setStyle(element, 'left', `${newLeft}px`);
    this.renderer.setStyle(element, 'top', `${newTop}px`);
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'move');
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;

    event.preventDefault();
    event.stopPropagation();

    const wasDrag = this.movedDistance > this.dragThreshold;

    this.isDragging = false;
    this.movedDistance = 0;

    const element = this.el.nativeElement;
    this.renderer.removeClass(document.body, 'dragging-active');
    this.renderer.removeClass(element, 'being-dragged');
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'default');

    this.removeGlobalListeners();

    if (!wasDrag) {
      // Emit synthetic event to distinguish click from drag
      const clickEvent = new CustomEvent('draggableClick', { bubbles: true, cancelable: true });
      element.dispatchEvent(clickEvent);
    }
  }
}
