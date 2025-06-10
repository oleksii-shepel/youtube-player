import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { PlaylistService } from 'src/app/services/playlist.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-playlist',
  template: `
    <ion-list class="playlist-container">
      <div class="list-header">
        <div>Playlist</div>

        <!-- Shuffle and Repeat Buttons in Header -->
        <div class="controls">
          <ion-button fill="clear" (click)="toggleShuffle()" [class.active]="isShuffled">
            <i [class]="isShuffled ? 'la la-check' : 'la la-random'"></i> Shuffle
          </ion-button>
          <ion-button fill="clear" (click)="toggleRepeat()" [class.active]="isRepeating">
            <i [class]="isRepeating ? 'la la-check' : 'la la-sync-alt'"></i> Repeat
          </ion-button>
        </div>
      </div>

      <div id="playlist" cdkDropList (cdkDropListDropped)="drop($event)">
        <app-playlist-track cdkDrag
          *ngFor="let track of playlist"
          [track]="track"
          [thumbnailUrl]="getTrackThumbnail(track)"
          [formattedDuration]="getTrackFormattedDuration(track)"
          (cdkDragStarted)="onDragStarted(track)"
          (trackSelected)="selectTrack(track)"
          [isSelected]="track === selectedTrack"
        ></app-playlist-track>
      </div>
    </ion-list>
  `,
  styleUrls: ['playlist.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
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
    this.playlistService.playlist.subscribe((playlist) => {
      this.playlist = playlist;
    });

    // Subscribe to the current track index observable to get the currently playing track
    this.playlistService.currentTrackIndex.subscribe((index) => {
      this.selectedTrack = this.playlist[index];
    });
  }

  // Get the thumbnail URL from the track object
  getTrackThumbnail(track: any): string {
    const thumbnail = track.snippet?.thumbnails?.high?.url || track.snippet?.thumbnails?.medium?.url || track.snippet?.thumbnails?.default?.url;
    return thumbnail || ''; // Return the best available thumbnail
  }

  // Format duration (assuming it's in ISO 8601 format)
  getTrackFormattedDuration(track: any): string {
    return track.contentDetails?.duration;
  }

  onDragStarted(track: any) {
    this.selectedTrack = track;
  }

  drop(event: CdkDragDrop<string[]>) { // Use CdkDragDrop generic for better type safety
    moveItemInArray(this.playlist, event.previousIndex, event.currentIndex);
    this.selectedTrack = this.playlist[event.currentIndex];
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
