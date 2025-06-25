import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  OnInit,
  HostListener,
} from '@angular/core';
import { PlaylistService } from 'src/app/services/playlist.service';
import { Subscription } from '@actioncrew/streamix'; // Use rxjs for Subscription as @actioncrew/streamix is not standard
import { Options } from 'sortablejs';

@Component({
  selector: 'app-playlist',
  template: `
    <ion-list class="playlist-container">
      <div class="list-header">
        <div class="controls">
          <ion-button
            fill="clear"
            (click)="toggleShuffle()"
            [class.active]="isShuffled"
          >
            <ion-icon *ngIf="!isShuffled" name="shuffle"></ion-icon>
            <svg
              *ngIf="isShuffled"
              xmlns="http://www.w3.org/2000/svg"
              width="18.898"
              height="18.898"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.0"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10 6h11" />
              <path d="M10 12h11" />
              <path d="M10 18h11" />
              <path d="M4 6h1v4" />
              <path d="M4 12h2" />
              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
            </svg>
          </ion-button>

          <ion-button
            fill="clear"
            (click)="playPrevious()"
            [disabled]="!hasPrevious"
          >
            <ion-icon name="play-skip-back"></ion-icon>
          </ion-button>

          <ion-button
            fill="clear"
            (click)="togglePlay()"
            [disabled]="!selectedTrack"
          >
            <ion-icon [name]="isPlaying ? 'pause' : 'play'"></ion-icon>
          </ion-button>

          <ion-button fill="clear" (click)="playNext()" [disabled]="!hasNext">
            <ion-icon name="play-skip-forward"></ion-icon>
          </ion-button>

          <ion-button
            fill="clear"
            (click)="toggleRepeat()"
            [class.active]="repeatMode !== 'none'"
          >
            <svg
              *ngIf="repeatMode === 'all'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-repeat-icon lucide-repeat"
            >
              <path d="m17 2 4 4-4 4" />
              <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
              <path d="m7 22-4-4 4-4" />
              <path d="M21 13v1a4 4 0 0 1-4 4H3" />
            </svg>

            <svg
              *ngIf="repeatMode === 'one'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-repeat1-icon lucide-repeat-1"
            >
              <path d="m17 2 4 4-4 4" />
              <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
              <path d="m7 22-4-4 4-4" />
              <path d="M21 13v1a4 4 0 0 1-4 4H3" />
              <path d="M11 10h1v4" />
            </svg>

            <svg
              *ngIf="repeatMode === 'none'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-repeat-off-icon lucide-repeat-off"
            >
              <path d="m17 2 4 4-4 4" />
              <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
              <path d="m7 22-4-4 4-4" />
              <path d="M21 13v1a4 4 0 0 1-4 4H3" />
              <line
                x1="4"
                y1="4"
                x2="20"
                y2="20"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </ion-button>
        </div>
      </div>

      <div id="playlist" [appSortable]="playlist" [sortableOptions]="sortablePlaylistOptions" (sortUpdate)="onPlaylistSort($event)">
        <app-playlist-track
          *ngFor="let track of playlist; let i = index"
          [track]="track"
          [thumbnailUrl]="getTrackThumbnail(track)"
          [formattedDuration]="getTrackFormattedDuration(track)"
          (click)="onTrackClick(i, $event)"
          (trackDeleted)="deleteTrack(track)"
          [isSelected]="isTrackSelectedByIndex(i)"
          [isPlaying]="i === currentTrackIndex && isPlaying"
        ></app-playlist-track>
      </div>
    </ion-list>
  `,
  styleUrls: ['playlist.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None,
})
export class PlaylistComponent implements OnInit { // Implement AfterViewInit
  @Input() playlist: any[] = [];
  @Output() trackSelected = new EventEmitter<any>();
  @Output() stateChanged = new EventEmitter<boolean>();

  isShuffled: boolean = false;
  isPlaying: boolean = false;
  selectedTrack: any = null;
  currentTrackIndex: number = -1;
  repeatMode: 'none' | 'all' | 'one' = 'none';
  hasPrevious: boolean = false;
  hasNext: boolean = false;

  private subscriptions: Subscription[] = [];

  sortablePlaylistOptions: Options = {
    group: 'playlist-items',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    forceFallback: true,
    delay: 200, // Wait before drag starts (in ms)
    delayOnTouchOnly: true, // Only apply delay for touch devices
    touchStartThreshold: 10, // Minimum px move before drag starts (on touch)
  };

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Del') {
      this.deleteSelectedTracks();
      event.preventDefault();
    }
  }

  constructor(private playlistService: PlaylistService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.playlistService.playlist.subscribe((playlist) => {
        this.playlist = playlist;
        this.updateNavigationState();

        // Auto-select first track if none is selected but playlist has items
        if (playlist.length > 0 && !this.selectedTrack) {
          this.playlistService.selectTrack(0, false, false);
        }
      })
    );

    this.subscriptions.push(
      this.playlistService.currentTrackIndex.subscribe((index) => {
        this.currentTrackIndex = index;
        this.selectedTrack = this.playlist[index];
        this.updateNavigationState();
      })
    );

    this.subscriptions.push(
      this.playlistService.playbackState.subscribe((state) => {
        this.isPlaying = state === 'playing';
        this.stateChanged.emit(this.isPlaying);
      })
    );

    this.subscriptions.push(
      this.playlistService.isShuffled.subscribe((shuffled) => {
        this.isShuffled = shuffled;
      })
    );

    this.subscriptions.push(
      this.playlistService.repeatMode.subscribe((mode) => {
        this.repeatMode = mode;
      })
    );

    this.isShuffled = this.playlistService.isPlaylistShuffled();
    this.repeatMode = this.playlistService.getRepeatMode();
  }

  deleteSelectedTracks(): void {
    this.playlistService.removeSelectedTracks();
  }

  onTrackClick(index: number, event: MouseEvent): void {
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const wasSelected = this.playlistService.selectedTrackIndexes.value.has(index);

    // Handle selection first
    this.playlistService.selectTrack(index, isCtrl, isShift);
    this.trackSelected.emit(this.playlist[index]);

    // Check if current playing track was deselected
    if (this.currentTrackIndex === index &&
        !this.playlistService.selectedTrackIndexes.value.has(index)) {
        this.playlistService.stop();
        this.playlistService.setCurrentTrackIndex(-1);
        return;
    }

    // Only change playback if:
    // 1. It's a single click (no modifiers)
    // 2. The clicked track isn't already the current track
    // 3. Or if it is the current track but paused
    if (!isCtrl && !isShift) {
        if (this.currentTrackIndex !== index || !this.isPlaying) {
            this.playlistService.setCurrentTrackIndex(index);
            this.playlistService.play();
        }
    }
  }

  isTrackSelectedByIndex(index: number): boolean {
    return this.playlistService.selectedTrackIndexes.value.has(index);
  }

  isTouchableDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private updateNavigationState(): void {
    this.hasPrevious = this.currentTrackIndex > 0 || this.isShuffled;
    this.hasNext =
      this.currentTrackIndex < this.playlist.length - 1 || this.isShuffled;
  }

  toggleShuffle(): void {
    this.playlistService.setShuffleState(!this.isShuffled);
  }

  toggleRepeat(): void {
    const current = this.repeatMode;
    let nextMode: 'none' | 'all' | 'one';

    switch (current) {
      case 'none':
        nextMode = 'all';
        break;
      case 'all':
        nextMode = 'one';
        break;
      default:
        nextMode = 'none';
        break;
    }

    this.playlistService.setRepeatMode(nextMode);
  }

  togglePlay(): void {
    if (!this.selectedTrack) return;

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

  getTrackThumbnail(track: any): string {
    const thumbnails = track.snippet?.thumbnails || {};
    return (
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      ''
    );
  }

  getTrackFormattedDuration(track: any): string {
    return track.contentDetails?.duration ?? '';
  }

  onPlaylistSort(event: { oldIndex: number; newIndex: number; item: any }): void {
    console.log('Playlist sorted:', event);
    this.playlistService.updatePlaylistOrder(this.playlist);

    if (this.selectedTrack === event.item) {
      this.playlistService.setCurrentTrackIndex(event.newIndex);
    } else {
      const newIndex = this.playlist.findIndex(track => track === this.selectedTrack);
      if (newIndex !== -1) {
        this.playlistService.setCurrentTrackIndex(newIndex);
      }
    }
  }

  deleteTrack(track: any): void {
    const index = this.playlist.indexOf(track);
    if (index !== -1) {
      this.playlist.splice(index, 1);
      this.playlistService.removeTrack(track);
      this.updateNavigationState();

      if (this.selectedTrack === track) {
        this.selectedTrack = null;
        this.playlistService.setCurrentTrackIndex(-1);
      }
    }
  }
}
