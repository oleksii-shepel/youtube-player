import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';

import { ShrinkNumberPipe } from '../../pipes/shrink-number.pipe';
import { YoutubeVideoComponent } from '../youtube-video/youtube-video.component';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { YouTubeChannel } from 'src/app/interfaces/youtube-channel-data';

@Component({
  selector: 'app-youtube-channel',
  template: `
    <div class="card channel-card" [class.expanded]="showUploadsList">
      <div class="channel-image-wrapper">
        <img [src]="channel.snippet.thumbnails.medium.url" alt="{{ channel.snippet.title }} thumbnail" class="channel-image">
        <div class="channel-info-overlay">
          <h5 class="channel-title-overlay">{{ channel.snippet.title }}
            <span class="badge bg-primary country-badge" [style.visibility]="channel.snippet.country ? 'visible': 'hidden'">{{ channel.snippet.country || 'N/A' }}</span>
          </h5>
          <div class="channel-stats-overlay">
            <span class="published-date"><small>Published: {{ channel.snippet.publishedAt | date }}</small></span>
            <span class="subscriber-count">{{ +channel.statistics.subscriberCount | shrink }} Subscribers</span>
            <span class="video-count">{{ channel.statistics.videoCount }} Videos</span>
          </div>
        </div>
      </div>
      <div class="card-content">
        <p class="card-description">{{ channel.snippet.description | slice: 0:150 }}</p>
      </div>
      <div class="action-buttons">
        <ion-button (click)="goToChannel(channel.id)" size="small" color="primary" outline>
          Visit Channel
        </ion-button>
        <ion-button (click)="subscribeToChannel()" size="small" color="danger" outline>
          Subscribe
        </ion-button>
        <ion-button (click)="toggleUploads()" size="small" color="secondary" outline>
          {{ showUploadsList ? 'Hide Uploads' : 'Uploads' }}
        </ion-button>
      </div>
      @if (showUploadsList) {
        <div class="video-list">
          <h4 class="video-list-header">Uploads</h4>
          <div class="video-list-wrapper">
            <div class="scrollable-container">
              @for (video of videosResponse?.items || []; track video) {
                <app-youtube-video [videoData]="video" [isCompact]="true" class="video-item"></app-youtube-video>
              }
            </div>
          </div>
        </div>
      }
    </div>
    `,
  styleUrls: ['./youtube-channel.component.scss'],
  standalone: true,
  imports: [CommonModule, ShrinkNumberPipe, YoutubeVideoComponent, IonicModule]
})
export class YoutubeChannelComponent {
  @Input('channelData') channel!: YouTubeChannel;
  @Output() toggle = new EventEmitter<boolean>();

  showUploadsList: boolean = false;
  videosResponse: any = '';

  constructor(private router: Router, public elRef: ElementRef) {}

  goToChannel(channelId: string) {
    this.router.navigate(['/channel', channelId]);
  }

  subscribeToChannel(): void {
    // Logic to subscribe to the channel (placeholder)
    alert('Subscribed to the channel!');
  }

  toggleUploads(): void {
    this.showUploadsList = !this.showUploadsList;
    this.toggle.emit(this.showUploadsList);

    if (this.showUploadsList && !this.videosResponse?.items?.length) {
      this.getVideos$();
    }
  }

  getVideos$() {
    // return this.youtubeSearch.searchPlaylistForVideos(this.channel.contentDetails.relatedPlaylists.uploads).pipe(
    //   tap(videos => {
    //     this.videosResponse = videos;
    //   })
    // );
  }
}
