import { Component, Input, AfterViewInit, ElementRef } from '@angular/core';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

@Component({
  selector: 'app-adsense',
  template: `
    <ins class="adsbygoogle"
         [attr.data-ad-client]="adClient"
         [attr.data-ad-slot]="adSlot"
         style="display:block"
         data-ad-format="auto"
         data-full-width-responsive="true">
    </ins>
  `,
  standalone: true
})
export class AdsenseComponent implements AfterViewInit {
  @Input() adClient!: string;
  @Input() adSlot!: string;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("AdSense error", e);
    }
  }
}
