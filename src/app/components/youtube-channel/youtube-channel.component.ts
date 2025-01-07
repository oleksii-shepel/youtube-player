import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { tap } from 'rxjs/operators';

import { ShrinkNumberPipe } from '../../pipes/shrink-number.pipe';
import { YoutubeVideoComponent } from '../youtube-video/youtube-video.component';
import { YoutubeDataService } from 'src/app/services/youtube-data.service';

@Component({
  selector: 'app-youtube-channel',
  template: `
    <div class="card channel-card" [class.expanded]="showUploadsList">
      <div class="card-content">
        <h5 class="channel-title">{{ channel.snippet.title }}
          <span class="badge bg-primary country-badge" [style.visibility]="channel.snippet.country ? 'visible': 'hidden'">{{ channel.snippet.country || 'N/A' }}</span>
        </h5>
        <p><img [src]="channel.snippet.thumbnails.medium.url" alt="{{ channel.snippet.title }} thumbnail" class="channel-image">
          <span class="card-text"><small class="text-muted">Published: {{ channel.snippet.publishedAt | date }}</small></span>
          <span class="badges">
            <span class="badge bg-info text-dark">{{ channel.statistics.subscriberCount | shrink }} Subscribers</span>
            <span class="badge bg-secondary">{{ channel.statistics.videoCount }} Videos</span>
          </span>
          <span class="card-description">{{ channel.snippet.description }}</span>
        </p>
      </div>
      <div class="action-buttons">
        <a [href]="getChannelUrl()" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">Visit Channel</a>
        <button class="btn btn-danger btn-sm" (click)="subscribeToChannel()">Subscribe</button>
        <button class="btn btn-secondary btn-sm" (click)="toggleUploads()">Uploads</button>
      </div>
      <div class="video-list" *ngIf="showUploadsList">
        <h4 class="video-list-header">Uploads</h4>
        <div class="video-list-wrapper">
          <div class="scrollable-container">
            <app-youtube-video *ngFor="let video of videosResponse?.items || []" [videoData]="video" [isCompact]="true" class="video-item"></app-youtube-video>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./youtube-channel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ShrinkNumberPipe, YoutubeVideoComponent]
})
export class YoutubeChannelComponent {
  @Input('channelData') channel: any;
  @Output() toggle = new EventEmitter<boolean>();

  showUploadsList: boolean = false;
  videosResponse: any = '';

  constructor(private youtubeSearch: YoutubeDataService, public elRef: ElementRef) {}

  getChannelUrl(): string {
    return this.channel.snippet.customUrl
      ? `https://www.youtube.com/${this.channel.snippet.customUrl}`
      : `https://www.youtube.com/channel/${this.channel.id}`;
  }

  subscribeToChannel(): void {
    // Logic to subscribe to the channel (placeholder)
    alert('Subscribed to the channel!');
  }

  toggleUploads(): void {
    this.showUploadsList = !this.showUploadsList;
    this.toggle.emit(this.showUploadsList);

    if (this.showUploadsList && this.videosResponse && this.videosResponse.items.length === 0) {
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
