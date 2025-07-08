import { HostListener, Injectable } from '@angular/core';
import { createUpdater } from '../utils/stateUpdater';
import { PlayerService } from './player.service';
import { YoutubePlayerComponent } from '../components/youtube-player/youtube-player.component';
import { createSubject } from '@actioncrew/streamix';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  // Reactive state
  playlist = createUpdater<any[]>([]);
  currentTrackIndex = createUpdater<number>(-1);
  playbackState = createUpdater<'playing' | 'paused' | 'stopped'>('stopped');

  isShuffled = createUpdater<boolean>(false);
  repeatMode = createUpdater<'none' | 'all' | 'one'>('none');
  menuButtonPressed = createSubject<void>();

  originalPlaylist: any[] = [];

  // Multi-selection state: holds indexes of selected tracks
  selectedTrackIndexes = createUpdater<Set<number>>(new Set());

  constructor(private playerService: PlayerService) {
    this.playerService.playbackState.subscribe(state => {
      this.playbackState.set(state);
    });

    this.playerService.repeatMode.subscribe(mode => {
      this.repeatMode.set(mode);
    });
  }

  setPlayerComponent(player: YoutubePlayerComponent) {
    this.playerService.setPlayerComponent(player);
  }

  addToPlaylist(video: any): void {
    if (!this.playlist.value.some(v => v.id === video.id)) {
      const newPlaylist = [...this.playlist.value, video];
      if (!this.isShuffled.value) this.originalPlaylist = [...newPlaylist];
      this.playlist.set(newPlaylist);

      // If playlist was empty before adding, start playing the new track
      if (this.playlist.value.length === 1) {
        this.setCurrentTrackIndex(0);
      }
    }
  }

  clearPlaylist(): void {
    this.playlist.set([]);
    this.originalPlaylist = [];
    this.currentTrackIndex.set(-1);
    this.clearSelection();
    this.playerService.stop();
  }

  removeTrack(track: any): void {
    const index = this.playlist.value.findIndex(t => t.id === track.id);
    if (index === -1) return;

    const newPlaylist = [
      ...this.playlist.value.slice(0, index),
      ...this.playlist.value.slice(index + 1),
    ];
    this.playlist.set(newPlaylist);

    if (this.currentTrackIndex.value === index) {
      this.playerService.stop();
      this.setCurrentTrackIndex(-1);
    } else if (this.currentTrackIndex.value > index) {
      this.setCurrentTrackIndex(this.currentTrackIndex.value - 1);
    }

    if (!this.isShuffled.value) {
      this.originalPlaylist = [...newPlaylist];
    } else {
      this.originalPlaylist = this.originalPlaylist.filter(t => t.id !== track.id);
    }

    // Remove track from selection if selected and update indexes
    const selected = new Set(this.selectedTrackIndexes.value);
    const updatedSelection = new Set<number>();

    selected.forEach(selectedIndex => {
      if (selectedIndex < index) {
        // Keep indexes that are before the removed track
        updatedSelection.add(selectedIndex);
      } else if (selectedIndex > index) {
        // Shift down indexes that are after the removed track
        updatedSelection.add(selectedIndex - 1);
      }
      // Skip the removed track index (don't add it to updatedSelection)
    });

    this.selectedTrackIndexes.set(updatedSelection);
  }

  removeSelectedTracks(): void {
    const selected = this.selectedTrackIndexes.value;
    if (selected.size === 0) return;

    const wasPlaying = this.playbackState.value === 'playing';
    const currentIndex = this.currentTrackIndex.value;
    const isCurrentRemoved = selected.has(currentIndex);

    const newPlaylist = this.playlist.value.filter((_, idx) => !selected.has(idx));
    this.playlist.set(newPlaylist);

    this.originalPlaylist = this.originalPlaylist.filter(t =>
      newPlaylist.some(nt => nt.id === t.id)
    );

    if (isCurrentRemoved) {
      this.playerService.stop();
      this.setCurrentTrackIndex(-1);

      if (newPlaylist.length > 0 && wasPlaying) {
          this.setCurrentTrackIndex(0);
          this.playCurrentTrack();
      } else {
          // No tracks left or wasn't playing, simply stop and clear index
          this.playerService.stop();
          this.setCurrentTrackIndex(-1);
      }
    } else {
      const removedBeforeCurrent = [...selected].filter(i => i < currentIndex).length;
      if (removedBeforeCurrent > 0) {
        this.setCurrentTrackIndex(currentIndex - removedBeforeCurrent);
      }
    }

    this.clearSelection();
  }

  updatePlaylistOrder(newOrder: any[]): void {
    if (this.isShuffled.value) {
      this.originalPlaylist = newOrder;
    }
    this.playlist.set(newOrder);
  }

  play(): void {
    if (this.playlist.value.length === 0) return;

    if (
      this.currentTrackIndex.value == null ||
      this.currentTrackIndex.value >= this.playlist.value.length
    ) {
      this.setCurrentTrackIndex(0);
    }

    this.playerService.show();
    this.playCurrentTrack();
  }

  pause(): void {
    this.playerService.pause();
  }

  stop(): void {
    this.playerService.stop();
  }

  next(): void {
    if (this.playlist.value.length === 0) return;

    if (this.repeatMode.value === 'none' && this.currentTrackIndex.value >= this.playlist.value.length - 1) {
      this.stop();
      this.setCurrentTrackIndex(-1);
      return;
    }

    const nextIndex =
      this.repeatMode.value === 'one'
        ? this.currentTrackIndex.value
        : this.getNextTrackIndex(this.currentTrackIndex.value);

    this.setCurrentTrackIndex(nextIndex);
    this.playCurrentTrack();
  }

  previous(): void {
    if (this.playlist.value.length === 0) return;

    if (this.repeatMode.value === 'none' && this.currentTrackIndex.value <= 0) {
      this.stop();
      this.setCurrentTrackIndex(-1);
      return;
    }

    const prevIndex =
      this.repeatMode.value === 'one'
        ? this.currentTrackIndex.value
        : this.getPreviousTrackIndex(this.currentTrackIndex.value);

    this.setCurrentTrackIndex(prevIndex);
    this.playCurrentTrack();
  }

  setCurrentTrackIndex(index: number): void {
    this.currentTrackIndex.set(index);
  }

  getCurrentTrack(): any | null {
    return this.playlist.value[this.currentTrackIndex.value] || null;
  }

  getCurrentTrackIndex(): number {
    return this.currentTrackIndex.value;
  }

  getPlaylist(): any[] {
    return this.playlist.value;
  }

  setRepeatMode(mode: 'none' | 'all' | 'one'): void {
    this.playerService.setRepeatMode(mode);
  }

  getRepeatMode(): 'none' | 'all' | 'one' {
    return this.playerService.getRepeatMode();
  }

  setShuffleState(shuffled: boolean): void {
    if (shuffled && !this.isShuffled.value) {
      this.originalPlaylist = [...this.playlist.value];
      this.playlist.set(this.shuffleArray([...this.playlist.value]));
      this.isShuffled.set(true);
    } else if (!shuffled && this.isShuffled.value) {
      const currentTrack = this.playlist.value[this.currentTrackIndex.value];
      const newIndex = this.originalPlaylist.findIndex(t => t.id === currentTrack.id);
      this.playlist.set([...this.originalPlaylist]);
      if (newIndex >= 0) this.setCurrentTrackIndex(newIndex);
      this.isShuffled.set(false);
    }
  }

  toggleMenu() {
    this.menuButtonPressed.next();
  }

  isPlaylistShuffled(): boolean {
    return this.isShuffled.value;
  }

  /**
   * Play a specific track by index (separate from selection)
   */
  playTrack(index: number): void {
    this.setCurrentTrackIndex(index);
    this.playCurrentTrack();
  }

  /**
   * Handle track selection for UI (does NOT change currently playing track)
   * Use this for all playlist UI interactions
   *
   * @param index Index clicked
   * @param ctrlKey true if Ctrl (or Cmd on Mac) pressed
   * @param shiftKey true if Shift pressed
   */
  selectTrack(index: number, ctrlKey = false, shiftKey = false): void {
    const selected = new Set(this.selectedTrackIndexes.value);

    if (shiftKey) {
      // Select range from last selected to clicked index
      const lastSelected = [...selected].length
        ? Math.max(...selected)
        : index;

      const start = Math.min(lastSelected, index);
      const end = Math.max(lastSelected, index);

      for (let i = start; i <= end; i++) {
        selected.add(i);
      }
    } else if (ctrlKey) {
      // Toggle selection of clicked index
      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }
    } else {
      // No modifier: select only this track (but don't play it)
      selected.clear();
      selected.add(index);
    }

    this.selectedTrackIndexes.set(selected);
  }

  clearSelection(): void {
    this.selectedTrackIndexes.set(new Set());
  }

  getSelectedTracks(): any[] {
    const selected = this.selectedTrackIndexes.value;
    return this.playlist.value.filter((_, idx) => selected.has(idx));
  }

  isTrackSelected(index: number): boolean {
    return this.selectedTrackIndexes.value.has(index);
  }

  // ========== Private helper methods ==========

  private getNextTrackIndex(currentIndex: number): number {
    return currentIndex >= this.playlist.value.length - 1
      ? this.repeatMode.value === 'all'
        ? 0
        : currentIndex
      : currentIndex + 1;
  }

  private getPreviousTrackIndex(currentIndex: number): number {
    return currentIndex <= 0
      ? this.repeatMode.value === 'all'
        ? this.playlist.value.length - 1
        : currentIndex
      : currentIndex - 1;
  }

  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private playCurrentTrack(): void {
    const track = this.getCurrentTrack();
    if (track) {
      this.playerService.playVideo(track.id);
    }
  }
}
