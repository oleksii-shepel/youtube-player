import { YoutubeDataService } from './../../services/youtube-data.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { YoutubeVideoComponent } from '../youtube-video/youtube-video.component';

@Component({
  selector: 'app-youtube-playlist',
  template: `
    <div class="card playlist-card" [class.expanded]="showVideosList">
      <div class="card-content">
        <!-- Flex container for image and header -->
        <div class="playlist-header">
          <div class="playlist-image-container">
            <img [src]="playlist.snippet.thumbnails.medium.url" alt="{{ playlist.snippet.title }} thumbnail" class="playlist-image">
          </div>
          <div class="card-title">
            <h5 class="card-header">{{ playlist.snippet.title }}</h5>
            <p class="card-text"><small class="text-muted">Published: {{ playlist.snippet.publishedAt | date }}</small></p>
            <div class="badge bg-secondary">{{ playlist.contentDetails.itemCount }} Videos</div>
          </div>
        </div>
        <section class="card-main">
          <!-- Description snippet -->
          <p class="card-description mt-2 mb-2" [attr.title]="playlist.snippet.description">
            {{ playlist.snippet.description | slice: 0:150 }}<span *ngIf="playlist.snippet.description.length > 150">...</span>
          </p>
        </section>
        <!-- Buttons for actions -->
        <div class="action-buttons">
          <a [href]="getPlaylistUrl()" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">View Playlist</a>
          <button class="btn btn-secondary btn-sm" (click)="toggleVideos()">Show Videos</button>
        </div>
      </div>

      <!-- Collapsible Section for Video List -->
      <div *ngIf="showVideosList" class="video-list">
        <h4 class="video-list-header">Playlist Videos</h4>
        <div class="scrollable-container">
          <app-youtube-video *ngFor="let video of videosResponse?.items || []" [videoData]="video" [isCompact]="true" class="video-item">
          </app-youtube-video>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./youtube-playlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, YoutubeVideoComponent],
})
export class YoutubePlaylistComponent {
  @Input('playlistData') playlist: any;
  showVideosList: boolean = false;
  videosResponse: any = '';

  constructor(private data: YoutubeDataService) {
  }

  getPlaylistUrl(): string {
    return `https://www.youtube.com/playlist?list=${this.playlist.id}`;
  }

  toggleVideos(): void {
  }

  getVideos$() {
    //this.videosResponse = this.data.search()
  }
}
