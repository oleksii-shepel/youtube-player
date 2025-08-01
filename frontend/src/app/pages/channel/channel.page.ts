import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeDataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { YoutubePlaylistComponent } from '../../components/playlist/youtube-playlist.component';
import { Subscription } from '@actioncrew/streamix';

@Component({
  selector: 'app-channel-page',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/search"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ channel?.snippet.title || 'Channel' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="channel-page">
      <div class="scrollable">
        @if (isLoadingChannel) {
          <ion-card class="skeleton-card">
            <ion-thumbnail class="ion-skeleton-text"></ion-thumbnail>
            <ion-skeleton-text animated class="skeleton-title"></ion-skeleton-text>
            <ion-skeleton-text animated class="skeleton-subtitle"></ion-skeleton-text>
            <ion-skeleton-text animated class="skeleton-description"></ion-skeleton-text>
            <ion-skeleton-text animated class="skeleton-description" style="width: 80%;"></ion-skeleton-text>
          </ion-card>
        } @else {
          @if (channel) {
            <ion-card>
              <img [src]="channel.snippet.thumbnails.medium.url" />
              <ion-card-header>
                <ion-card-title>{{ channel.snippet.title }}</ion-card-title>
                <ion-card-subtitle>
                  Subscribers: {{ channel.statistics.subscriberCount | number }}
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                {{ channel.snippet.description }}
              </ion-card-content>
            </ion-card>
          }
        }


        <ion-list class="playlists">
          <ion-list-header>Playlists</ion-list-header>

          @if (isLoadingPlaylists) {
            @for (i of [1,2,3]; track i) {
              <ion-item lines="none">
                <ion-thumbnail slot="start" class="ion-skeleton-text"></ion-thumbnail>
                <ion-label>
                  <ion-skeleton-text animated style="width: 80%"></ion-skeleton-text>
                  <ion-skeleton-text animated style="width: 60%"></ion-skeleton-text>
                </ion-label>
              </ion-item>
            }
          } @else {
            <div class="adaptive-grid">
              @for (playlist of playlists; track playlist) {
                <app-youtube-playlist
                  [playlistData]="playlist"
                ></app-youtube-playlist>
              }
            </div>
          }


        </ion-list>
      </div>
    </ion-content>
    `,
  styleUrls: ["channel.page.scss"],
  standalone: true,
  imports: [CommonModule, IonicModule, YoutubePlaylistComponent],
})
export class ChannelPage implements OnInit {
  channelId!: string;
  channel: any = null;
  playlists: any[] = [];
  isLoadingChannel = true;
  isLoadingPlaylists = true;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: YoutubeDataService
  ) {}

  ngOnInit() {
    this.channelId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.channelId) {
      this.router.navigate(['/search']);
      return;
    }

    this.loadChannel();
    this.loadPlaylists();
  }

  loadChannel() {
    this.isLoadingChannel = true;

    this.subscriptions.push(this.dataService.fetchChannels([this.channelId]).subscribe({
      next: (res) => {
        const item = res.items?.[0];

        if (item && item.snippet && item.statistics) {
          this.channel = item;
        }

        this.isLoadingChannel = false;
      },
      error: (err) => {
        console.error('Failed to load channel info:', err);
        this.isLoadingChannel = false;
      },
    }));
  }

  loadPlaylists() {
    this.isLoadingPlaylists = true;

    this.subscriptions.push(this.dataService.fetchPlaylistsByChannel(this.channelId).subscribe({
      next: (res) => {
        const items = res.items || [];

        const filtered = items.filter((item: any) =>
          item.snippet && item.contentDetails
        );

        this.playlists = filtered;
        this.isLoadingPlaylists = false;
      },
      error: (err) => {
        console.error('Failed to load channel playlists:', err);
        this.isLoadingPlaylists = false;
      },
    }));
  }
}
