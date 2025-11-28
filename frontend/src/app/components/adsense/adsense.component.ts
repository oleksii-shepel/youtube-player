import { Component, Input, AfterViewInit, ElementRef } from '@angular/core';
import { environment } from 'src/environments/environment';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

@Component({
  selector: 'app-adsense',
  template: `
    <ins class="adsbygoogle"
         [attr.data-ad-client]="client"
         [attr.data-ad-slot]="slot"
         style="display:block"
         data-ad-format="auto"
         data-full-width-responsive="true">
    </ins>
  `,
  standalone: true
})
export class AdsenseComponent {
  @Input() client = environment.adSense.clientId;
  @Input('data') slot!: string;

  constructor(private el: ElementRef) {}
}
