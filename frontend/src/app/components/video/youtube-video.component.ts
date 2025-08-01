import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, OnDestroy, ElementRef, Renderer2, EventEmitter, Output } from '@angular/core';

import { ShrinkNumberPipe, ToFriendlyDurationPipe } from '../../pipes';
import { YouTubeVideo } from 'src/app/interfaces/video';
import { Router } from '@angular/router';
import { AppFontSize, AppThumbnailSize } from 'src/app/interfaces/settings';

@Component({
  selector: 'app-youtube-video',
  template: `
    <div class="video-card" [class.compact]="isCompact">
      <div class="video-image-wrapper">
        <ion-img [src]="thumbnailUrl" alt="{{ video.snippet.title }} thumbnail" class="video-image"></ion-img>
        <span class="video-duration">{{ video.contentDetails.duration | toFriendlyDuration }}</span>
        <div class="video-info-overlay">
          <span class="view-count">{{ +video.statistics.viewCount | shrink }} views</span>
          <span class="publish-date">{{ video.snippet.publishedAt | date }}</span>
        </div>
        @if (isCompact) {
          <div class="video-duration-overlay">
            {{ video.contentDetails.duration | toFriendlyDuration }}
          </div>
        }
      </div>

      @if (!isCompact) {
        <div class="video-info">
          <h5 class="video-title" [attr.title]="video.snippet.description">{{ video.snippet.title }}</h5>
          @if (displayDescription) {
            <p class="video-description">{{video.snippet.description}}</p>
          }
          <div class="action-buttons">
            <ion-button (click)="addToPlaylist(video)" size="small">
              <ion-icon name="add-circle-outline" slot="start"></ion-icon>
              Add to Playlist
            </ion-button>
            <ion-button (click)="gotoDetails(video.id)" size="small">
              <ion-icon name="heart-outline" slot="start"></ion-icon>
              View Details
            </ion-button>
          </div>
        </div>
      }

      @if (isCompact) {
        <div class="video-info compact-info">
          <h5 class="video-title" [attr.title]="video.snippet.title">{{ video.snippet.title }}</h5>
        </div>
      }
    </div>
    `,
  styleUrls: ['./youtube-video.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ToFriendlyDurationPipe, ShrinkNumberPipe],
})
export class YoutubeVideoComponent implements OnInit, OnDestroy {
  @Input('videoData') video!: YouTubeVideo;
  @Input() isCompact: boolean = false;
  @Input() displayDescription: boolean = true;

  @Output() addTrackToPlaylist = new EventEmitter<any>();

  thumbnailUrl: string = '';
  private resizeListener!: () => void;

  constructor(private el: ElementRef, private renderer: Renderer2, private router: Router) {}

  ngOnInit(): void {
    this.updateThumbnailSize();
    this.resizeListener = () => this.updateThumbnailSize();
    window.addEventListener('resize', this.resizeListener);  // Listen for window resize
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);  // Clean up event listener
  }

  private updateThumbnailSize(): void {
    if (!this.video?.snippet?.thumbnails) {
      return; // Handle cases where video data might be incomplete
    }

    const componentWidth = this.el.nativeElement.offsetWidth;  // Get the width of the component

    // Select thumbnail size based on the component's width
    if (componentWidth < 200) {
      this.thumbnailUrl = this.video.snippet.thumbnails.default?.url || '';
    } else if (componentWidth < 400) {
      this.thumbnailUrl = this.video.snippet.thumbnails.medium?.url || '';
    } else {
      this.thumbnailUrl = this.video.snippet.thumbnails.high?.url || '';
    }
  }

  getVideoUrl(): string {
    return `https://www.youtube.com/watch?v=${this.video.id}`;
  }

  gotoDetails(videoId: string): void {
    // Logic to add the video to favorites (placeholder)
    this.router.navigate(['/video', videoId]);
  }

  addToPlaylist(video: any): void {
    this.addTrackToPlaylist.emit(video);
  }
}
