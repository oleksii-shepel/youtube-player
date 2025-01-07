import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[onscreen]',
  standalone: true
})
export class OnScreenDirective implements OnInit {
  @Input() offset: number = 5; // Distance from the clicked button

  private element: HTMLElement;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.element = this.el.nativeElement;
  }

  ngOnInit() {
    this.renderer.setStyle(this.element, 'position', 'fixed');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    
    if (clickedElement.tagName === 'BUTTON') {
      const buttonRect = clickedElement.getBoundingClientRect();
      const elementRect = this.element.getBoundingClientRect();

      let top: number;
      let left: number;

      // Determine vertical position
      if (buttonRect.top + elementRect.height <= window.innerHeight) {
        // Dropdown fits below the button
        top = buttonRect.bottom + this.offset;
      } else if (buttonRect.bottom - elementRect.height >= 0) {
        // Dropdown fits above the button
        top = buttonRect.top - elementRect.height - this.offset;
      } else {
        // Center vertically if it doesn't fit above or below
        top = (window.innerHeight - elementRect.height) / 2;
      }

      // Determine horizontal position
      if (buttonRect.left + elementRect.width <= window.innerWidth) {
        // Dropdown fits to the right of the button
        left = buttonRect.left;
      } else if (buttonRect.right - elementRect.width >= 0) {
        // Dropdown fits to the left of the button
        left = buttonRect.right - elementRect.width;
      } else {
        // Center horizontally if it doesn't fit on either side
        left = (window.innerWidth - elementRect.width) / 2;
      }

      // Ensure the element doesn't go beyond screen edges
      top = Math.max(this.offset, Math.min(top, window.innerHeight - elementRect.height - this.offset));
      left = Math.max(this.offset, Math.min(left, window.innerWidth - elementRect.width - this.offset));

      this.renderer.setStyle(this.element, 'top', `${top}px`);
      this.renderer.setStyle(this.element, 'left', `${left}px`);
    }
  }
}