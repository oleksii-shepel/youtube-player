import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeDataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { YoutubeVideoComponent } from '../../components/youtube-video/youtube-video.component';
import { of, Subscription } from '@actioncrew/streamix';
import { PlaylistService } from 'src/app/services/playlist.service';
import { map, switchMap } from '@actioncrew/streamix';

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
        <ion-card *ngIf="playlist" class="playlist-header-card">
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
        <div *ngIf="videos.length > 0" class="videos-grid">
          <div
            *ngFor="let video of videos"
            class="video-item"
            [class.selected]="isSelected(video.contentDetails.videoId || video.id)"
            (click)="toggleSelection(video.contentDetails.videoId || video.id)"
          >
            <app-youtube-video
              [videoData]="video"
              (addTrackToPlaylist)="onAddTrackToPlaylist(video)"
            ></app-youtube-video>
          </div>
        </div>

        <ion-infinite-scroll (ionInfinite)="loadMore()">
          <ion-infinite-scroll-content
            loadingSpinner="bubbles"
            loadingText="Loading more..."
          >
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </div>
    </ion-content>

    <ion-footer *ngIf="selectedVideoIds.size > 0">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="clearSelection()">Clear</ion-button>
        </ion-buttons>
        <ion-title>{{ selectedVideoIds.size }} selected</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="addSelectedToPlaylist()">
            <ion-icon name="add" slot="start"></ion-icon>
            Add to Playlist
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styleUrls: ['playlist.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, YoutubeVideoComponent],
})
export class PlaylistPage implements OnInit, OnDestroy {
  playlistId!: string;
  playlist: any = null;
  videos: any[] = [];
  showFullDescription: boolean = false;
  nextPageToken: string | null = null;
  allLoaded = false;
  loadingVideos = false;
  selectedVideoIds = new Set<string>();

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: YoutubeDataService,
    private playlistService: PlaylistService
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
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  toggleDescription() {
    this.showFullDescription = !this.showFullDescription;
  }

  async loadPlaylistAndVideos() {
    this.videos = [];
    this.allLoaded = false;
    this.nextPageToken = null;

    this.subscriptions.push(this.dataService.fetchPlaylistById(this.playlistId).subscribe((res) => {
      this.playlist = res.items?.[0] || null;
    }));

    this.loadMore();
  }

  loadMore() {
    if (this.loadingVideos || this.allLoaded) return;

    this.loadingVideos = true;

    this.subscriptions.push(this.dataService
      .fetchPlaylistItems(this.playlistId, this.nextPageToken)
      .pipe(
        switchMap((res: any) => {
          const items = res.items || [];
          this.nextPageToken = res.nextPageToken || null;

          const videoIds = items
            .map((item: any) => item.contentDetails?.videoId)
            .filter(Boolean);

          if (videoIds.length === 0) {
            this.allLoaded = true;
            return of([]);
          }

          return this.dataService.fetchVideos(videoIds).pipe(
            map((videoRes: any) => {
              const detailedItems = videoRes.items || [];
              const requiredFields = ['snippet', 'contentDetails', 'statistics'];
              const filtered = detailedItems.filter((v: any) =>
                requiredFields.every((key) => key in v)
              );

              const merged = items
                .map((item: any) => {
                  const full = filtered.find((v: any) => v.id === item.contentDetails?.videoId);
                  return full ? { ...item, ...full } : null;
                })
                .filter(Boolean);

              return merged;
            })
          );
        })
      )
      .subscribe({
        next: (newVideos: any[]) => {
          this.videos.push(...newVideos);
          this.allLoaded = !this.nextPageToken;
          this.loadingVideos = false;
        },
        error: (err) => {
          console.error('Error loading more videos:', err);
          this.loadingVideos = false;
        },
      }));
  }

  toggleSelection(videoId: string) {
    if (this.selectedVideoIds.has(videoId)) {
      this.selectedVideoIds.delete(videoId);
    } else {
      this.selectedVideoIds.add(videoId);
    }
  }

  isSelected(videoId: string): boolean {
    return this.selectedVideoIds.has(videoId);
  }

  clearSelection() {
    this.selectedVideoIds.clear();
  }

  addSelectedToPlaylist() {
    const selected = this.videos.filter((video) =>
      this.selectedVideoIds.has(video.contentDetails.videoId || video.id)
    );
    selected.forEach((video) => this.playlistService.addToPlaylist(video));
    this.clearSelection();
  }

  onAddTrackToPlaylist(video: any) {
    this.playlistService.addToPlaylist(video);
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
