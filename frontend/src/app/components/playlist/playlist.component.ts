
import { IonicModule } from '@ionic/angular';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { PlaylistService } from 'src/app/services/playlist.service';
import { Subscription } from '@actioncrew/streamix';
import { Options } from 'sortablejs';
import { TrackComponent } from '../track/track.component';
import { DirectiveModule } from 'src/app/directives';

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
            @if (!isShuffled) {
              <ion-icon name="shuffle"></ion-icon>
            }
            @if (isShuffled) {
              <svg
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
            }
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
            @if (repeatMode === 'all') {
              <svg
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
            }

            @if (repeatMode === 'one') {
              <svg
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
            }

            @if (repeatMode === 'none') {
              <svg
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
              }
            </ion-button>
          </div>
        </div>

        <div class="scrollable">
          <div id="playlist" [appSortable]="playlist" [sortableOptions]="sortablePlaylistOptions" (sortUpdate)="onPlaylistSort($event)">
            @for (track of playlist; track track; let i = $index) {
              <app-playlist-track
                [track]="track"
                [thumbnailUrl]="getTrackThumbnail(track)"
                [formattedDuration]="getTrackFormattedDuration(track)"
                (click)="onTrackClick(i, $event)"
                (trackDeleted)="deleteTrack(track)"
                [isSelected]="isTrackSelectedByIndex(i)"
                [isPlaying]="i === currentTrackIndex && isPlaying"
              ></app-playlist-track>
            }
          </div>
        </div>

        <!-- Playlist Action Buttons -->
        @if (playlist.length > 0) {
          <ion-footer class="playlist-footer-actions">
            <ion-toolbar>
              <div class="action-buttons-row">
                <!-- Clear Selected Button -->
                <ion-button
                  fill="clear"
                  color="warning"
                  (click)="clearSelectedTracks()"
                  [disabled]="selectedTrackIndexes.size === 0"
                  size="small"
                  >
                  <ion-icon name="remove-circle-outline" slot="start"></ion-icon>
                  Clear Selected ({{ selectedTrackIndexes.size }})
                </ion-button>
                <!-- Clear All Button -->
                <ion-button
                  fill="clear"
                  color="danger"
                  (click)="clearAllTracks()"
                  size="small"
                  >
                  <ion-icon name="trash-outline" slot="start"></ion-icon>
                  Clear All
                </ion-button>
                <!-- Invert Selection Button -->
                <ion-button
                  fill="clear"
                  color="medium"
                  (click)="invertSelection()"
                  [disabled]="playlist.length === 0"
                  size="small"
                  >
                  <ion-icon name="swap-horizontal-outline" slot="start"></ion-icon>
                  Invert
                </ion-button>
                <!-- Save Playlist Button -->
                <ion-button
                  fill="solid"
                  color="primary"
                  (click)="savePlaylist()"
                  [disabled]="playlist.length === 0"
                  size="small"
                  >
                  <ion-icon name="save-outline" slot="start"></ion-icon>
                  Save
                </ion-button>
              </div>
              @if (selectedTrackIndexes.size > 0) {
                <div
                  class="selection-info"
                  style="text-align: center; margin-top: 4px"
                  >
                  <ion-text color="medium">
                    {{ selectedTrackIndexes.size }} of {{ playlist.length }} tracks selected
                  </ion-text>
                </div>
              }
            </ion-toolbar>
          </ion-footer>
        }
      </ion-list>
    `,
  styleUrls: ['playlist.component.scss'],
  standalone: true,
  imports: [IonicModule, TrackComponent, DirectiveModule]
})
export class PlaylistComponent implements OnInit, OnDestroy {
  @Input() playlist: any[] = [];
  @Output() stateChanged = new EventEmitter<boolean>();
  @Output() playlistSaved = new EventEmitter<any[]>();
  @Output() playlistCleared = new EventEmitter<void>();

  isShuffled: boolean = false;
  isPlaying: boolean = false;
  selectedTrack: any = null;
  currentTrackIndex: number = -1;
  repeatMode: 'none' | 'all' | 'one' = 'none';
  hasPrevious: boolean = false;
  hasNext: boolean = false;
  selectedTrackIndexes: Set<number> = new Set();
  previousPlaylist: any[] = [];

  private subscriptions: Subscription[] = [];

  sortablePlaylistOptions: Options = {
    group: 'playlist-items',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    forceFallback: true,
    delay: 200,
    delayOnTouchOnly: true,
    touchStartThreshold: 10,
    onStart: () => {
      this.previousPlaylist = [...this.playlist]; // Capture original before sorting
    }
  };

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Del') {
      this.deleteSelectedTracks();
      event.preventDefault();
    } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      this.selectAllTracks();
      event.preventDefault();
    } else if (event.key === 'i' && (event.ctrlKey || event.metaKey)) {
      this.invertSelection();
      event.preventDefault();
    }
  }

  constructor(private playlistService: PlaylistService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.playlistService.playlist.subscribe((playlist) => {
        this.playlist = playlist;
        this.updateNavigationState();
        this.validateSelection();
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
      this.playlistService.playbackState$.subscribe((state) => {
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

    // Subscribe to selected track indexes
    this.subscriptions.push(
      this.playlistService.selectedTrackIndexes.subscribe((indexes) => {
        this.selectedTrackIndexes = new Set(indexes);
      })
    );

    this.isShuffled = this.playlistService.isPlaylistShuffled();
    this.repeatMode = this.playlistService.getRepeatMode();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private updateNavigationState(): void {
    this.hasPrevious = this.currentTrackIndex > 0 || this.isShuffled;
    this.hasNext = this.currentTrackIndex < this.playlist.length - 1 || this.isShuffled;
  }

  private validateSelection(): void {
    // Remove selected indexes that are out of bounds
    const validIndexes = new Set<number>();
    this.selectedTrackIndexes.forEach(index => {
      if (index >= 0 && index < this.playlist.length) {
        validIndexes.add(index);
      }
    });

    if (validIndexes.size !== this.selectedTrackIndexes.size) {
      this.selectedTrackIndexes = validIndexes;
    }
  }

  // Selection Methods
  selectAllTracks(): void {
    const allIndexes = Array.from({ length: this.playlist.length }, (_, i) => i);
    this.selectedTrackIndexes = new Set(allIndexes);
    this.playlistService.selectedTrackIndexes.next(this.selectedTrackIndexes);
  }

  clearSelectedTracks(): void {
    this.playlistService.removeSelectedTracks();
    this.selectedTrackIndexes.clear();
  }

  invertSelection(): void {
    const allIndexes = new Set(Array.from({ length: this.playlist.length }, (_, i) => i));
    const currentSelected = this.selectedTrackIndexes;
    const inverted = new Set<number>();

    const currentIndex = this.currentTrackIndex;

    allIndexes.forEach(index => {
      if (!currentSelected.has(index) || index === currentIndex) {
        inverted.add(index);
      }
    });

    this.selectedTrackIndexes = inverted;
    this.playlistService.selectedTrackIndexes.next(this.selectedTrackIndexes);
  }

  // Action Methods
  clearAllTracks(): void {
    if (this.playlist.length === 0) return;

    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to clear all ${this.playlist.length} tracks from the playlist?`);

    if (confirmed) {
      this.playlist = [];
      this.selectedTrackIndexes.clear();
      this.currentTrackIndex = -1;
      this.selectedTrack = null;
      this.isPlaying = false;

      this.playlistService.clearPlaylist();
      this.playlistCleared.emit();
    }
  }

  deleteSelectedTracks(): void {
    if (this.selectedTrackIndexes.size === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${this.selectedTrackIndexes.size} selected track(s)?`);

    if (confirmed) {
      this.playlistService.removeSelectedTracks();
      this.selectedTrackIndexes.clear();
    }
  }

  savePlaylist(): void {
    if (this.playlist.length === 0) return;

    const playlistName = prompt('Enter playlist name:', 'My Playlist');

    if (playlistName && playlistName.trim()) {
      const playlistData = {
        name: playlistName.trim(),
        tracks: this.playlist,
        createdAt: new Date().toISOString(),
        trackCount: this.playlist.length
      };

      this.playlistService.savePlaylist(playlistData);
      this.playlistSaved.emit(this.playlist);

      // Show success message
      alert(`Playlist "${playlistName}" saved successfully!`);
    }
  }

  // Existing Methods
  deleteTrack(track: any): void {
    const index = this.playlist.indexOf(track);
    if (index !== -1) {
      this.playlist.splice(index, 1);
      this.playlistService.removeTrack(track);
      this.updateNavigationState();
      this.validateSelection();

      if (this.selectedTrack === track) {
        this.selectedTrack = null;
        this.playlistService.setCurrentTrackIndex(-1);
      }
    }
  }

  onTrackClick(index: number, event: MouseEvent): void {
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    this.playlistService.selectTrack(index, isCtrl, isShift);

    if (!isCtrl && !isShift) {
      this.playlistService.setCurrentTrackIndex(index);
      this.playlistService.play();
    }

    // Stop if current track deselected
    if (
      this.playlistService.currentTrackIndex.snappy === index &&
      !this.playlistService.selectedTrackIndexes.snappy.has(index)
    ) {
      this.playlistService.stop();
      this.playlistService.setCurrentTrackIndex(-1);
    }
  }

  /**
   * Helper method to deselect a range from last selected to given index
   */
  private deselectRange(targetIndex: number): void {
    const selected = new Set(this.playlistService.selectedTrackIndexes.snappy);
    if (selected.size === 0) return;

    const lastSelected = Math.max(...selected);
    const start = Math.min(lastSelected, targetIndex);
    const end = Math.max(lastSelected, targetIndex);

    for (let i = start; i <= end; i++) {
      selected.delete(i);
    }

    this.playlistService.selectedTrackIndexes.next(selected);
  }

  isTrackSelectedByIndex(index: number): boolean {
    return this.selectedTrackIndexes.has(index);
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
    const newIndex = this.playlistService.currentTrackIndex.snappy;
    if (newIndex !== -1) {
      this.playlistService.setCurrentTrackIndex(newIndex);
    }
  }

  playPrevious(): void {
    this.playlistService.previous();
    const newIndex = this.playlistService.currentTrackIndex.snappy;
    if (newIndex !== -1) {
      this.playlistService.setCurrentTrackIndex(newIndex);
    }
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
    this.playlistService.updatePlaylistOrder(this.playlist);

    const newSelectedIndexes = new Set<number>();
    this.previousPlaylist.forEach((track, oldIndex) => {
      if (this.selectedTrackIndexes.has(oldIndex)) {
        const newIndex = this.playlist.indexOf(track);
        if (newIndex !== -1) {
          newSelectedIndexes.add(newIndex);
        }
      }
    });

    this.selectedTrackIndexes = newSelectedIndexes;
    this.playlistService.selectedTrackIndexes.next(this.selectedTrackIndexes);

    // Update current track index
    const newIndex = this.playlist.indexOf(this.selectedTrack);
    if (newIndex !== -1) {
      this.playlistService.setCurrentTrackIndex(newIndex);
    }

    this.previousPlaylist = []; // Clear to avoid stale state
  }

  isTouchableDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }
}
