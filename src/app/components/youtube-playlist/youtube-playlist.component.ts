import { IonicModule } from '@ionic/angular';
import { YoutubeDataService } from './../../services/youtube-data.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { YoutubeVideoComponent } from '../youtube-video/youtube-video.component';

@Component({
  selector: 'app-youtube-playlist',
  template: `
    <div class="playlist-card" [class.expanded]="showVideosList">
      <div class="card-content">
        <div class="playlist-image-wrapper">
          <div class="playlist-image-container">
            <img [src]="playlist.snippet.thumbnails.medium.url" alt="{{ playlist.snippet.title }} thumbnail" class="playlist-image">
          </div>
          <div class="playlist-image-overlay">
            <span class="published-date">Published: {{ playlist.snippet.publishedAt | date }}</span>
            <span class="video-count">{{ playlist.contentDetails.itemCount }} Videos</span>
          </div>
        </div>
        <div class="playlist-info">
          <h5 class="card-header">{{ playlist.snippet.title }}</h5>
        </div>
        <section class="card-main">
          <p class="card-description mt-2 mb-2" [attr.title]="playlist.snippet.description">
            {{ playlist.snippet.description | slice: 0:150 }}<span *ngIf="playlist.snippet.description.length > 150">...</span>
          </p>
        </section>
        <div class="action-buttons">
          <ion-button [href]="getPlaylistUrl()" target="_blank" rel="noopener noreferrer" size="small">
            View Playlist
          </ion-button>
          <ion-button (click)="toggleVideos()" size="small">
            {{ showVideosList ? 'Hide Videos' : 'Show Videos' }}
          </ion-button>
        </div>
      </div>

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
  imports: [CommonModule, IonicModule, YoutubeVideoComponent],
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
