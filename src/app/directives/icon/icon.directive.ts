import { Directive, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import { isNewChange } from 'src/app/shared/utils//data.utils';

const ICON_PREFIX_STANDARD = 'fa';
export const ICON_PREFIX_BRAND = 'fa-brands';
const ICON_LIB_PREFIX = 'fa';
@Directive({
  selector: 'icon',
  standalone: true
})
export class IconComponent implements OnInit, OnChanges {
  @Input() name = '';
  @Input() prefix = ICON_PREFIX_STANDARD;

  icons = {
    fa: true
  };

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    const { name } = this;
    let classes = [this.prefix];
    if (name) {
      classes = [...classes, ...this.createIconStyles(name)];
    }
    this.setClasses(classes);
  }

  ngOnChanges({ name }: SimpleChanges) {
    if (name && isNewChange(name)) {
      this.createIconStyles(name.currentValue);
    }
  }

  createIconStyles(names: string): string[] {
    return names.split(' ').map(name => `${ICON_LIB_PREFIX}-${name}`);
  }

  setClasses(names: string[]) {
    names.forEach(name => this.renderer.addClass(this.el.nativeElement, name));
  }
}
