import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { PlaylistService } from 'src/app/services/playlist.service';
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';
import { createHttpClient, readJson } from '@actioncrew/streamix/http';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-split-pane contentId="main-content">
        <!-- Menu -->
        <ion-menu contentId="main-content" type="overlay" menuId="main-menu">
          <div class="content">
            <app-playlist (trackSelected)="onTrackSelected($event)" class="expandable-list"></app-playlist>

            <!-- YouTube Player -->
            <youtube-player
              #youtubePlayer
              [videoId]="selectedVideoId"
              class="player"
              (videoEnded)="onPlayerStateChange($event)"
            ></youtube-player>
          </div>
        </ion-menu>

        <!-- Main Content -->
        <div id="main-content">
          <ion-router-outlet></ion-router-outlet>
        </div>
      </ion-split-pane>
    </ion-app>
  `,
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements AfterViewInit {
  @ViewChild('youtubePlayer') youtubePlayer!: YoutubePlayerComponent;
  selectedVideoId: string = '';
  playlist: any[] = []; // The playlist will be injected via the PlaylistService

  constructor(private playlistService: PlaylistService) {}

  ngAfterViewInit(): void {
    const API_URL = "https://jsonplaceholder.typicode.com/posts/1";
    const client = createHttpClient();

    client.get(API_URL, readJson).subscribe((value) =>
      console.log(value)
    );
  }

  // Handle the track selection from the playlist
  onTrackSelected(track: any): void {
    this.selectedVideoId = track.id;
    const trackIndex = this.playlistService.getPlaylist().indexOf(track);
    this.playlistService.setCurrentTrackIndex(trackIndex);
  }

  // Play the next track
  playNextTrack(): void {
    const currentTrackIndex = this.playlistService.getCurrentTrackIndex();
    const nextTrackIndex = this.playlistService.getNextTrackIndex(currentTrackIndex);
    const nextTrack = this.playlistService.getPlaylist()[nextTrackIndex];
    this.selectedVideoId = nextTrack.id;
    this.playlistService.setCurrentTrackIndex(nextTrackIndex);
  }

  // Play the previous track
  playPreviousTrack(): void {
    const currentTrackIndex = this.playlistService.getCurrentTrackIndex();
    const previousTrackIndex = this.playlistService.getPreviousTrackIndex(currentTrackIndex);
    const previousTrack = this.playlistService.getPlaylist()[previousTrackIndex];
    this.selectedVideoId = previousTrack.id;
    this.playlistService.setCurrentTrackIndex(previousTrackIndex);
  }

  // Event listener for YouTube Player state changes (e.g., when a video ends)
  onPlayerStateChange(event: any): void {
    this.playNextTrack();
  }
}
