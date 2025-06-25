import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[ngLet]',
  standalone: false
})
export class NgLetDirective<T> {
  constructor(
    private view: ViewContainerRef,
    private template: TemplateRef<any>
  ) {}

  @Input()
  set ngLet(context: T) {
    this.view.clear();
    this.view.createEmbeddedView(this.template, { $implicit: context });
  }
}
