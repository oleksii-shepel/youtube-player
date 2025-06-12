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
              (videoEnded)="onPlayerStateChange($event)"
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

  selectedVideoId: string = '';
  private subscriptions: Subscription[] = [];

  constructor(public playlistService: PlaylistService) {}

  ngAfterViewInit(): void {
    // Keep selected video in sync with service's current index
    const sub = this.playlistService.currentTrackIndex.subscribe(index => {
      const track = this.playlistService.getPlaylist()[index];
      this.selectedVideoId = track?.id || '';
    });
    this.subscriptions.push(sub);
  }

  onTrackSelected(track: any): void {
    this.selectedVideoId = track.id;
    const trackIndex = this.playlistService.getPlaylist().indexOf(track);
    this.playlistService.setCurrentTrackIndex(trackIndex);
    this.playlistService.play(); // Ensure playback starts when manually selecting
  }

  playNextTrack(): void {
    this.playlistService.next(); // Updates index & triggers playback
  }

  playPreviousTrack(): void {
    this.playlistService.previous();
  }

  onPlayerStateChange(event: any): void {
    this.playNextTrack();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
