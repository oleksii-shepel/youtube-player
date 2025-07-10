import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeDataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController } from '@ionic/angular';
import { YoutubeVideoComponent } from '../../components/youtube-video/youtube-video.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-playlist-page',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/search"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ playlist?.snippet?.title || 'Playlist' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="playlist-page">
      <div class="playlist-container scrollable">
        <!-- Playlist Header Section -->
        <div *ngIf="isLoadingPlaylist" class="skeleton-card">
          <ion-thumbnail class="ion-skeleton-text"></ion-thumbnail>
          <ion-skeleton-text animated class="skeleton-title"></ion-skeleton-text>
          <ion-skeleton-text animated class="skeleton-subtitle"></ion-skeleton-text>
          <ion-skeleton-text animated class="skeleton-description"></ion-skeleton-text>
          <ion-skeleton-text animated class="skeleton-description" style="width: 80%;"></ion-skeleton-text>
          <ion-skeleton-text animated class="skeleton-button"></ion-skeleton-text>
        </div>

        <ion-card *ngIf="playlist && !isLoadingPlaylist" class="playlist-header-card">
          <img [src]="playlist.snippet.thumbnails.medium.url" alt="{{ playlist.snippet.title }}" />
          <ion-card-header>
            <ion-card-title>{{ playlist.snippet.title }}</ion-card-title>
            <ion-card-subtitle>
              <span>Published: {{ playlist.snippet.publishedAt | date:'mediumDate' }}</span>
              <span *ngIf="playlist.contentDetails?.itemCount">
                • {{ playlist.contentDetails.itemCount }} videos
              </span>
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p [class]="showFullDescription ? 'description-full' : 'description-truncated'">
              {{ playlist.snippet.description || 'No description available.' }}
            </p>
            <ion-button
              *ngIf="playlist.snippet.description && playlist.snippet.description.length > 150"
              fill="clear"
              (click)="toggleDescription()"
              class="description-toggle"
            >
              {{ showFullDescription ? 'Show Less' : 'Show More' }}
            </ion-button>
          </ion-card-content>
          <div class="playlist-actions">
            <ion-button expand="block" fill="outline" (click)="goToChannel(playlist.snippet.channelId)">
              <ion-icon name="person-circle-outline" slot="start"></ion-icon>
              Channel
            </ion-button>
            <ion-button expand="block" class="play-all" (click)="playAllVideos(playlist.id)">
              <ion-icon name="play-circle-outline" slot="start"></ion-icon>
              Play All
            </ion-button>
          </div>
        </ion-card>

        <!-- Videos Grid -->
        <div *ngIf="!isLoadingVideos && videos.length > 0" class="videos-grid">
          <div *ngFor="let video of videos" class="video-item" (click)="goToVideo(video.contentDetails.videoId || video.id)">
            <app-youtube-video
              [videoData]="video"
              [isCompact]="true"
              (addTrackToPlaylist)="onAddTrackToPlaylist($event)"
            ></app-youtube-video>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['playlist.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, YoutubeVideoComponent],
})
export class PlaylistPage implements OnInit, OnDestroy {
  playlistId!: string;
  playlist: any = null;
  videos: any[] = [];
  isLoadingPlaylist: boolean = true;
  isLoadingVideos: boolean = true;
  showFullDescription: boolean = false;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private youtubeDataService: YoutubeDataService,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.playlistId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.playlistId) {
      this.router.navigate(['/search']);
      return;
    }

    this.loadPlaylistAndVideos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDescription() {
    this.showFullDescription = !this.showFullDescription;
  }

  async loadPlaylistAndVideos() {

    this.isLoadingPlaylist = true;
    this.isLoadingVideos = true;
    this.playlist = null;
    this.videos = [];

    // Your actual API calls would go here
    // For now, using the mock data from your example
    setTimeout(() => {
      this.playlist = {
        id: this.playlistId,
        snippet: {
          title: 'Amazing Ocean Adventures',
          description: 'A curated collection of stunning ocean exploration videos. Dive deep into the mysteries of the underwater world with breathtaking footage of marine life, vibrant coral reefs, and thrilling encounters. This playlist is perfect for ocean lovers, aspiring marine biologists, or anyone looking to relax with beautiful aquatic scenes. Discover new species, explore sunken shipwrecks, and witness the majesty of the deep blue sea. From gentle giants to tiny creatures, every video is an adventure.',
          publishedAt: '2025-05-15T08:30:00Z',
          thumbnails: {
            default: { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120&h=90&fit=crop' },
            medium: { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=320&h=180&fit=crop' },
            high: { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=480&h=360&fit=crop' },
          },
          channelId: 'UC_CHANNEL_ID_MOCK',
          channelTitle: 'Ocean Explorer',
        },
        contentDetails: {
          itemCount: 3
        }
      };
      this.isLoadingPlaylist = false;
    }, 1000);

    setTimeout(() => {
      this.videos = [
        {
          id: 'mockVideo1',
          contentDetails: { videoId: 'e2Q4L_g-xQk', duration: 'PT5M30S' },
          snippet: {
            title: 'Amazing Ocean Waves & Sunset',
            publishedAt: '2025-06-20T12:00:00Z',
            thumbnails: {
              medium: { url: 'https://img.youtube.com/vi/e2Q4L_g-xQk/mqdefault.jpg' },
            },
            channelTitle: 'Ocean Explorer',
          },
          statistics: { viewCount: '12345', likeCount: '678' }
        },
        {
          id: 'mockVideo2',
          contentDetails: { videoId: 'tO0Rj8cWJkU', duration: 'PT8M15S' },
          snippet: {
            title: 'Underwater Coral Reefs Exploration',
            publishedAt: '2025-05-18T09:30:00Z',
            thumbnails: {
              medium: { url: 'https://img.youtube.com/vi/tO0Rj8cWJkU/mqdefault.jpg' },
            },
            channelTitle: 'Ocean Explorer',
          },
          statistics: { viewCount: '9876', likeCount: '543' }
        },
        {
          id: 'mockVideo3',
          contentDetails: { videoId: 'P_VpX-MhF28', duration: 'PT12M0S' },
          snippet: {
            title: 'Diving with Gentle Giant Whale Sharks',
            publishedAt: '2025-04-25T15:15:00Z',
            thumbnails: {
              medium: { url: 'https://img.youtube.com/vi/P_VpX-MhF28/mqdefault.jpg' },
            },
            channelTitle: 'Ocean Explorer',
          },
          statistics: { viewCount: '6789', likeCount: '321' }
        }
      ];
      this.isLoadingVideos = false;
    }, 1500);
  }

  private async checkLoadingComplete(loading: HTMLIonLoadingElement) {
    if (!this.isLoadingPlaylist && !this.isLoadingVideos) {
      await loading.dismiss();
    }
  }

  onAddTrackToPlaylist(video: any) {
    console.log('Add to Playlist:', video);
  }

  goToVideo(videoId: string) {
    this.router.navigate(['/video', videoId]);
  }

  goToChannel(channelId: string) {
    this.router.navigate(['/channel', channelId]);
  }

  playAllVideos(playlistId: string) {
    if (this.videos.length > 0) {
      this.router.navigate(['/video', this.videos[0].contentDetails.videoId], {
        queryParams: { playlistId: playlistId, index: 0 },
      });
    } else {
      console.warn('Cannot play all: No videos in playlist.');
    }
  }
}
