import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PlaylistService } from 'src/app/services/playlist.service';

@Component({
  selector: 'app-playlist',
  template: `
    <ion-list class="playlist-container">
      <div class="list-header">
        <div>Playlist</div>

        <!-- Shuffle and Repeat Buttons in Header -->
        <div class="controls">
          <button (click)="toggleShuffle()" [class.active]="isShuffled">
            <i [class]="isShuffled ? 'la la-check' : 'la la-random'"></i> Shuffle
          </button>
          <button (click)="toggleRepeat()" [class.active]="isRepeating">
            <i [class]="isRepeating ? 'la la-check' : 'la la-sync-alt'"></i> Repeat
          </button>
        </div>
      </div>

      <div id="playlist">
        <div>
          <app-playlist-track
            *ngFor="let track of playlist"
            [track]="track"
            (trackSelected)="selectTrack(track)"
            [isSelected]="track === selectedTrack"
          ></app-playlist-track>
        </div>
      </div>
    </ion-list>
  `,
  styleUrls: ['playlist.component.scss'],
  standalone: false,
})
export class PlaylistComponent {
  @Input() playlist: any[] = [];
  @Output() trackSelected = new EventEmitter<any>(); // Emit selected track to parent

  isShuffled: boolean = false;
  isRepeating: boolean = false;
  selectedTrack: any = null; // Track selected by user

  constructor(private playlistService: PlaylistService) {}

  ngOnInit(): void {
    // Subscribe to the playlist observable
    this.playlistService.playlist$.subscribe((playlist) => {
      this.playlist = playlist;
    });

    // Subscribe to the current track index observable to get the currently playing track
    this.playlistService.currentTrackIndex$.subscribe((index) => {
      this.selectedTrack = this.playlist[index];
    });
  }

  selectTrack(track: any): void {
    this.selectedTrack = track;
    // Update current track in the PlaylistService
    const trackIndex = this.playlist.indexOf(track);
    this.playlistService.setCurrentTrackIndex(trackIndex);
    this.trackSelected.emit(track); // Emit track to parent component
  }

  toggleShuffle(): void {
    this.isShuffled = !this.isShuffled;
    if (this.isShuffled) {
      this.playlistService.shufflePlaylist(); // Shuffle the playlist
    }
  }

  toggleRepeat(): void {
    this.isRepeating = !this.isRepeating;
    // Handle repeat logic here (can be added to PlaylistService if needed)
  }
}
