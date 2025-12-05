import { CommonModule } from '@angular/common';
import { Component, Input, HostBinding, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AdvertisementService, ProductItem } from 'src/app/services/advertisement.service';

@Component({
  selector: 'app-advertisement',
  standalone: true,
  template: `
    <div class="ad-card">
      @if (item) {
        <!-- IMAGE -->
        <div class="ad-image-wrapper">
          <ion-img
            [src]="imageUrl"
            alt="{{ item.description }}"
            class="ad-image">
          </ion-img>

          <div class="ad-info-overlay">
            <span class="ad-badge-left">Sponsored</span>
            <span class="ad-badge-right">Amazon</span>
          </div>
        </div>

        <!-- INFO -->
        <div class="ad-info">
          <h5 class="ad-title" [attr.title]="item.description">
            {{ item.description }}
          </h5>

          <div class="ad-action-buttons">
            <ion-button (click)="openLink()" size="small">
              <ion-icon name="cart-outline" slot="start"></ion-icon>
              View Product
            </ion-button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['advertisement.component.scss'],
  imports: [IonicModule, CommonModule]
})
export class AdvertisementComponent implements OnInit {

  /** MODE: 'random' | 'sequential' */
  @Input() mode: 'random' | 'sequential' = 'random';

  @Input() colors: string[] = [
    '#FF6B6B', '#4ECDC4', '#556270',
    '#C7F464', '#C44D58', '#FFA600', '#6A4C93'
  ];

  @HostBinding('style.background') background!: string;
  @HostBinding('style.color') textColor!: string;

  item!: ProductItem;
  imageUrl = '';

  constructor(private ads: AdvertisementService) {}

  ngOnInit() {
    this.setRandomBackground();
    this.pickAd();
  }

  private pickAd() {
    this.item = this.mode === 'sequential'
      ? this.ads.getSequentialAd()
      : this.ads.getRandomAd();

    this.item && (this.imageUrl = `./assets/ads/amazon/${this.item.image}.jpg`);
  }

  private setRandomBackground() {
    const i = Math.floor(Math.random() * this.colors.length);
    this.background = this.colors[i];
    this.textColor = this.getContrastColor(this.background);
  }

  private getContrastColor(hex: string): string {
    // Remove "#" if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Perceived brightness (YIQ)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black for bright colors, white for dark
    return yiq >= 128 ? '#000000' : '#FFFFFF';
  }

  openLink() {
    if (this.item?.link) window.open(this.item.link, '_blank');
  }
}