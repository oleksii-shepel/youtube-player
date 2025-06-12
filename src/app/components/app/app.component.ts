import { Component, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { PlaylistService } from '../../services/playlist.service';
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';
import { Subscription } from '@actioncrew/streamix';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-split-pane contentId="main-content">
        <ion-menu contentId="main-content" type="overlay" menuId="main-menu">
          <div class="content">
            <app-playlist (trackSelected)="onTrackSelected($event)" class="expandable-list"></app-playlist>

            <youtube-player
              #youtubePlayer
              [videoId]="selectedVideoId"
              class="player"
              (videoEnded)="onPlayerVideoEnded()"
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
  private subscriptions: Subscription[] = [];

  constructor(public playlistService: PlaylistService) {}

  ngAfterViewInit(): void {
    // Inform PlaylistService about the player component instance
    this.playlistService.setPlayerComponent(this.youtubePlayer);

    // Sync selectedVideoId with playlist's current track index
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
    // Move to the next track when video ends
    this.playlistService.next();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
