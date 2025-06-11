import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { PlaylistService } from 'src/app/services/playlist.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-playlist',
  template: `
    <ion-list class="playlist-container">
      <div class="list-header">
        <div class="controls">
          <ion-button fill="clear" (click)="toggleShuffle()" [class.active]="isShuffled">
            <ion-icon name="shuffle"></ion-icon>
          </ion-button>
          <ion-button fill="clear" (click)="playPrevious()">
            <ion-icon name="play-skip-back"></ion-icon>
          </ion-button>
          <ion-button fill="clear" (click)="togglePlay()">
            <ion-icon [name]="isPlaying ? 'pause' : 'play'"></ion-icon>
          </ion-button>
          <ion-button fill="clear" (click)="playNext()">
            <ion-icon name="play-skip-forward"></ion-icon>
          </ion-button>
          <ion-button fill="clear" (click)="toggleRepeat()" [class.active]="repeatMode !== 'none'">
            <ion-icon name="repeat"></ion-icon>
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
  @Output() trackSelected = new EventEmitter<any>();

  isShuffled: boolean = false;
  isPlaying: boolean = false;
  selectedTrack: any = null;
  repeatMode: 'none' | 'all' | 'one' = 'none';

  constructor(private playlistService: PlaylistService) {}

  ngOnInit(): void {
    this.playlistService.playlist.subscribe(playlist => {
      this.playlist = playlist;
    });

    this.playlistService.currentTrackIndex.subscribe(index => {
      this.selectedTrack = this.playlist[index];
    });

    this.playlistService.playbackState.subscribe(state => {
      this.isPlaying = state === 'playing';
    });

    this.isShuffled = this.playlistService.isPlaylistShuffled();
    this.repeatMode = this.playlistService.getRepeatMode();
  }

  toggleShuffle(): void {
    this.isShuffled = !this.isShuffled;
    this.playlistService.setShuffleState(this.isShuffled);
  }

  toggleRepeat(): void {
    if (this.repeatMode === 'none') {
      this.repeatMode = 'all';
    } else if (this.repeatMode === 'all') {
      this.repeatMode = 'one';
    } else {
      this.repeatMode = 'none';
    }

    this.playlistService.setRepeatMode(this.repeatMode);
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.playlistService.pause();
    } else {
      this.playlistService.play();
    }
  }

  playNext(): void {
    this.playlistService.next();
  }

  playPrevious(): void {
    this.playlistService.previous();
  }

  selectTrack(track: any): void {
    this.selectedTrack = track;
    const trackIndex = this.playlist.indexOf(track);
    this.playlistService.setCurrentTrackIndex(trackIndex);
    this.playlistService.play();
    this.trackSelected.emit(track);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.playlist, event.previousIndex, event.currentIndex);
    this.selectedTrack = this.playlist[event.currentIndex];
    this.playlistService.updatePlaylistOrder(this.playlist);
  }

  getTrackThumbnail(track: any): string {
    const thumbnails = track.snippet?.thumbnails || {};
    return thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';
  }

  getTrackFormattedDuration(track: any): string {
    return track.contentDetails?.duration ?? '';
  }

  onDragStarted(track: any): void {
    this.selectedTrack = track;
  }
}
