import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, ElementRef, Renderer2 } from '@angular/core';

import { ShrinkNumberPipe, ToFriendlyDurationPipe } from '../../pipes';

@Component({
  selector: 'app-youtube-video',
  template: `
    <div [ngClass]="{ 'video-card': true, 'compact': isCompact }">
        <!-- Video Image Container -->
        <div class="video-image-container">
            <img [src]="thumbnailUrl" alt="{{ video.snippet.title }} thumbnail" class="video-image">
        </div>

        <!-- Video Info for Full Mode -->
        <div *ngIf="!isCompact" class="video-info">
            <h5 class="video-title" [attr.title]="video.snippet.description">{{ video.snippet.title }}</h5>
            <p class="video-stats">
            <span>{{ video.statistics.viewCount | shrink }} views</span> •
            <span>{{ video.snippet.publishedAt | date }}</span>
            </p>
            <div class="action-buttons">
            <a [href]="getVideoUrl()" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">Watch Video</a>
            <button class="btn btn-secondary btn-sm" (click)="addToFavorites()">Add to Favorites</button>
            </div>
        </div>

        <!-- Video Info for Compact Mode -->
        <div *ngIf="isCompact" class="video-info compact-info">
            <h5 class="video-title" [attr.title]="video.snippet.title">{{ video.snippet.title }}</h5>
            <p class="video-duration">{{ video.contentDetails.duration | toFriendlyDuration }}</p>
        </div>
    </div>
  `,
  styleUrls: ['./youtube-video.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ToFriendlyDurationPipe, ShrinkNumberPipe],
})
export class YoutubeVideoComponent implements OnInit {
  @Input('videoData') video: any;
  @Input() isCompact: boolean = false;

  thumbnailUrl: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.updateThumbnailSize();
    window.addEventListener('resize', this.updateThumbnailSize.bind(this));  // Listen for window resize
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.updateThumbnailSize.bind(this));  // Clean up event listener
  }

  private updateThumbnailSize(): void {
    const componentWidth = this.el.nativeElement.offsetWidth;  // Get the width of the component

    // Select thumbnail size based on the component's width
    if (componentWidth < 200) {
      this.thumbnailUrl = this.video.snippet.thumbnails.default.url;
    } else if (componentWidth < 400) {
      this.thumbnailUrl = this.video.snippet.thumbnails.medium.url;
    } else {
      this.thumbnailUrl = this.video.snippet.thumbnails.high.url;
    }
  }

  getVideoUrl(): string {
    return `https://www.youtube.com/watch?v=${this.video.id}`;
  }

  addToFavorites(): void {
    // Logic to add the video to favorites (placeholder)
    alert('Added to favorites!');
  }
}
