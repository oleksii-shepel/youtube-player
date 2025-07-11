import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeDataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { YoutubePlaylistComponent } from '../../components/youtube-playlist/youtube-playlist.component';

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
        <ng-container *ngIf="isLoadingChannel; else channelContent">
          <ion-card class="skeleton-card">
            <ion-thumbnail class="ion-skeleton-text"></ion-thumbnail>
            <ion-skeleton-text animated class="skeleton-title"></ion-skeleton-text>
            <ion-skeleton-text animated class="skeleton-subtitle"></ion-skeleton-text>
            <ion-skeleton-text animated class="skeleton-description"></ion-skeleton-text>
            <ion-skeleton-text animated class="skeleton-description" style="width: 80%;"></ion-skeleton-text>
          </ion-card>
        </ng-container>

        <ng-template #channelContent>
          <ion-card *ngIf="channel">
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
        </ng-template>

        <ion-list class="playlists">
          <ion-list-header>Playlists</ion-list-header>

          <ng-container *ngIf="isLoadingPlaylists; else playlistsContent">
            <ion-item *ngFor="let i of [1,2,3]" lines="none">
              <ion-thumbnail slot="start" class="ion-skeleton-text"></ion-thumbnail>
              <ion-label>
                <ion-skeleton-text animated style="width: 80%"></ion-skeleton-text>
                <ion-skeleton-text animated style="width: 60%"></ion-skeleton-text>
              </ion-label>
            </ion-item>
          </ng-container>

          <ng-template #playlistsContent>
            <app-youtube-playlist
              *ngFor="let playlist of playlists"
              [playlistData]="playlist"
            ></app-youtube-playlist>
          </ng-template>

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
    // Simulate async fetch with timeout and mock data
    this.isLoadingChannel = true;
    setTimeout(() => {
      this.channel = {
        id: this.channelId,
        snippet: {
          title: 'Ocean Explorer Channel',
          description: 'Explore the wonders of the ocean with amazing videos on marine life, underwater exploration, and more.',
          thumbnails: {
            default: { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120&h=90&fit=crop' },
            medium: { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=320&h=180&fit=crop' },
            high: { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=480&h=360&fit=crop' },
          },
        },
        statistics: {
          subscriberCount: 123456,
          videoCount: 48,
          viewCount: 3456789,
        },
      };
      this.isLoadingChannel = false;
    }, 1000);

    // Uncomment for real API call:
    /*
    this.dataService.fetchChannels([this.channelId]).subscribe(res => {
      if (res.items.length > 0) {
        this.channel = res.items[0];
      }
      this.isLoadingChannel = false;
    });
    */
  }

  loadPlaylists() {
    this.isLoadingPlaylists = true;
    setTimeout(() => {
      this.playlists = [
        {
          id: 'playlist1',
          snippet: {
            title: 'Amazing Ocean Adventures',
            description: 'A curated collection of stunning ocean exploration videos.',
            thumbnails: {
              medium: { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=320&h=180&fit=crop' },
            },
          },
          contentDetails: {
            itemCount: 10
          }
        },
        {
          id: 'playlist2',
          snippet: {
            title: 'Coral Reef Life',
            description: 'Discover the beauty of coral reefs with these amazing videos.',
            thumbnails: {
              medium: { url: 'https://images.unsplash.com/photo-1526647927077-1a47ee7ef8be?w=320&h=180&fit=crop' },
            },
          },
          contentDetails: {
            itemCount: 15
          }
        },
        {
          id: 'playlist3',
          snippet: {
            title: 'Whale Watching',
            description: 'Exciting videos featuring whales and other marine giants.',
            thumbnails: {
              medium: { url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=320&h=180&fit=crop' },
            },
          },
          contentDetails: {
            itemCount: 8
          }
        }
      ];
      this.isLoadingPlaylists = false;
    }, 1200);

    // Uncomment for real API call:
    /*
    this.dataService.fetchPlaylistsByChannel(this.channelId).subscribe(res => {
      this.playlists = res.items || [];
      this.isLoadingPlaylists = false;
    });
    */
  }
}
