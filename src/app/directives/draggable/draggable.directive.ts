import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appDraggable]',
  standalone: false
})
export class DraggableDirective {
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;

  constructor(private el: ElementRef) {
    const element = this.el.nativeElement;
    element.style.position = 'absolute';
    element.style.cursor = 'move';
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const style = window.getComputedStyle(this.el.nativeElement);
    this.initialLeft = parseInt(style.left || '0', 10);
    this.initialTop = parseInt(style.top || '0', 10);

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.isDragging) return;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    this.el.nativeElement.style.left = `${this.initialLeft + dx}px`;
    this.el.nativeElement.style.top = `${this.initialTop + dy}px`;
  };

  onMouseUp = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };
}
