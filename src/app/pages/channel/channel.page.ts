import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeDataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { YoutubePlaylistComponent } from '../../components/youtube-playlist/youtube-playlist.component';

@Component({
  selector: 'app-channel',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/search"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ channel?.snippet.title || 'Channel' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content *ngIf="channel">
      <ion-card>
        <img [src]="channel.snippet.thumbnails.medium.url" />
        <ion-card-header>
          <ion-card-title>{{ channel.snippet.title }}</ion-card-title>
          <ion-card-subtitle>
            Subscribers: {{ channel.statistics.subscriberCount }}
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          {{ channel.snippet.description }}
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-list-header>Playlists</ion-list-header>
        <app-youtube-playlist
          *ngFor="let playlist of playlists"
          [playlistData]="playlist"
        ></app-youtube-playlist>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule, YoutubePlaylistComponent],
})
export class ChannelPage implements OnInit {
  channelId!: string;
  channel: any = null;
  playlists: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private youtubeDataService: YoutubeDataService
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
    this.youtubeDataService.fetchChannels([this.channelId]).subscribe((res) => {
      if (res.items.length > 0) {
        this.channel = res.items[0];
      }
    });
  }

  loadPlaylists() {
    // Use channelId to fetch playlists owned by channel
  }
}
