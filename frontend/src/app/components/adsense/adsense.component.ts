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
    @if (slot) {
      <ins class="adsbygoogle" 
        [attr.data-ad-client]="client"
        [attr.data-ad-slot]="slot"
        data-ad-format="auto"
        data-full-width-responsive="true">
      </ins>
    }
  `,
  standalone: true
})
export class AdsenseComponent implements AfterViewInit {

  availableSlots = ['2273755219', '6000305283', '7777363337'];

  client = environment.adSense.clientId;
  slot: string | undefined;

  private initialized = false;

  constructor(private el: ElementRef) {
    if (!this.slot) {
      this.slot = this.availableSlots[
        Math.floor(Math.random() * this.availableSlots.length)
      ];
    }
  }

  ngAfterViewInit() {
    if (this.initialized) return;
    this.initialized = true;

    const tryInit = () => {
      const ins: HTMLElement = this.el.nativeElement.querySelector('ins');
      if (!ins || ins.offsetWidth === 0 || ins.offsetHeight === 0) {
        // Element not sized yet, try next frame
        requestAnimationFrame(tryInit);
        return;
      }

      window.adsbygoogle = window.adsbygoogle || [];
      try {
        window.adsbygoogle.push({});
      } catch (e) {
        console.warn('Adsense error:', e);
      }
    };

    requestAnimationFrame(tryInit);
  }
}
