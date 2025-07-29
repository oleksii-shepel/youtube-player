import { IonicModule } from '@ionic/angular';
import { YoutubeDataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { YoutubeVideoComponent } from '../youtube-video/youtube-video.component';
import { Router } from '@angular/router';
import { YouTubePlaylist } from 'src/app/interfaces/playlist';
import { AppFontSize } from 'src/app/interfaces/settings';

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
            {{ playlist.snippet.description | slice: 0:150 }}@if (playlist.snippet.description.length > 150) {
            <span>...</span>
          }
        </p>
      </section>
      <div class="action-buttons">
        <ion-button (click)="goToPlaylist(playlist.id)" size="small">
          View Playlist
        </ion-button>
        <ion-button (click)="toggleVideos()" size="small">
          {{ showVideosList ? 'Hide Videos' : 'Show Videos' }}
        </ion-button>
      </div>
    </div>

    @if (showVideosList) {
      <div class="video-list">
        <h4 class="video-list-header">Playlist Videos</h4>
        <div class="scrollable-container">
          @for (video of videosResponse?.items || []; track video) {
            <app-youtube-video [videoData]="video" [isCompact]="true" class="video-item">
            </app-youtube-video>
          }
        </div>
      </div>
    }
    </div>
    `,
  styleUrls: ['./youtube-playlist.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, YoutubeVideoComponent],
})
export class YoutubePlaylistComponent {
  @Input('playlistData') playlist!: YouTubePlaylist;
  @Input() displayDescription: boolean = true;

  showVideosList: boolean = false;
  videosResponse: any = '';

  constructor(private router: Router) {
  }

  goToPlaylist(playlistId: string) {
    this.router.navigate(['/playlist', playlistId]);
  }

  toggleVideos(): void {
  }

  getVideos$() {
    //this.videosResponse = this.data.search()
  }
}
