import { Component, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { PlaylistService } from '../../services/playlist.service';
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';
import { Subscription } from '@actioncrew/streamix';

declare const YT: any; // Add this to access YT.PlayerState constants

@Component({
  selector: 'app-root',
  template: `
    <ion-app id="mainContainer">
      <ion-split-pane contentId="main-content">
        <ion-menu contentId="main-content" type="overlay" menuId="main-menu">
          <div class="content">
            <app-playlist (trackSelected)="onTrackSelected($event)" class="expandable-list"></app-playlist>

            <youtube-player
              #youtubePlayer
              [videoId]="selectedVideoId"
              class="player"
              (videoEnded)="onPlayerVideoEnded()"
              (change)="onPlayerStateChange($event)"
            ></youtube-player>
          </div>
        </ion-menu>

        <div id="main-content">
          <ion-router-outlet></ion-router-outlet>
        </div>
      </ion-split-pane>
    </ion-app>
  `,
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('youtubePlayer') youtubePlayer!: YoutubePlayerComponent;

  selectedVideoId = '';
  currentPlayerState: number = -1;
  private subscriptions: Subscription[] = [];

  constructor(public playlistService: PlaylistService) {}

  ngAfterViewInit(): void {
    this.playlistService.setPlayerComponent(this.youtubePlayer);

    const sub = this.playlistService.currentTrackIndex.subscribe(index => {
      const track = this.playlistService.getPlaylist()[index];
      if (track && track.id !== this.selectedVideoId) {
        this.selectedVideoId = track.id;
      }
    });
    this.subscriptions.push(sub);
  }

  onTrackSelected(track: any): void {
    const playlist = this.playlistService.getPlaylist();
    const trackIndex = playlist.findIndex(t => t.id === track.id);

    if (trackIndex >= 0) {
      this.playlistService.setCurrentTrackIndex(trackIndex);
      this.playlistService.play();
    }
  }

  onPlayerVideoEnded(): void {
    this.playlistService.next();
  }

  onPlayerStateChange(event: YT.PlayerEvent & any) {
    this.currentPlayerState = event.data;

    if (event.data === YT.PlayerState.PAUSED) {
      this.playlistService.pause();
    } else if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.UNSTARTED || event.data === YT.PlayerState.BUFFERING) {
      this.playlistService.play();
    } else if (event.data === YT.PlayerState.ENDED) {
      // Optional: handle ended state here or rely on videoEnded event
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
