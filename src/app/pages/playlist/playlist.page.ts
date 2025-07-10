import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeDataService } from '../../services/data.service';
import { Stream } from '@actioncrew/streamix';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { YoutubeVideoComponent } from '../../components/youtube-video/youtube-video.component';

@Component({
  selector: 'app-playlist',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/search"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ playlist?.snippet.title || 'Playlist' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content *ngIf="playlist">
      <ion-card>
        <img [src]="playlist.snippet.thumbnails.medium.url" />
        <ion-card-header>
          <ion-card-title>{{ playlist.snippet.title }}</ion-card-title>
          <ion-card-subtitle>
            Published: {{ playlist.snippet.publishedAt | date }}
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          {{ playlist.snippet.description }}
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-list-header>
          Playlist Videos ({{ videos?.length || 0 }})
        </ion-list-header>
        <ion-item *ngFor="let video of videos">
          <app-youtube-video
            [videoData]="video"
            [isCompact]="true"
          ></app-youtube-video>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule, YoutubeVideoComponent],
})
export class PlaylistPage implements OnInit {
  playlistId!: string;
  playlist: any = null;
  videos: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private youtubeDataService: YoutubeDataService
  ) {}

  ngOnInit() {
    this.playlistId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.playlistId) {
      this.router.navigate(['/search']);
      return;
    }

    this.loadPlaylist();
    this.loadVideos();
  }

  loadPlaylist() {
    this.youtubeDataService
      .fetchPlaylists([this.playlistId])
      .subscribe((response) => {
        if (response.items.length > 0) {
          this.playlist = response.items[0];
        }
      });
  }

  loadVideos() {
    // playlistItems API, maxResults=50 for demo (handle pagination as needed)
  }
}
