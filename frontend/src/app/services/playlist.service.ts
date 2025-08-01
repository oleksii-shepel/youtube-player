import { Injectable } from '@angular/core';
import { PlayerService } from './player.service';
import { YoutubePlayerComponent } from '../components/player/youtube-player.component';
import { createBehaviorSubject, createSubject } from '@actioncrew/streamix';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  // Reactive state
  playlist = createBehaviorSubject<any[]>([]);
  currentTrackIndex = createBehaviorSubject<number>(-1);
  playbackState$ = createBehaviorSubject<'playing' | 'paused' | 'stopped'>('stopped');

  isShuffled = createBehaviorSubject<boolean>(false);
  repeatMode = createBehaviorSubject<'none' | 'all' | 'one'>('none');
  menuButtonPressed = createSubject<void>();

  originalPlaylist: any[] = [];
  lastSelectedIndex: number | null = null;

  // Multi-selection state: holds indexes of selected tracks
  selectedTrackIndexes = createBehaviorSubject<Set<number>>(new Set());

  constructor(private playerService: PlayerService) {
    this.playerService.playbackState.subscribe(state => {
      this.playbackState$.next(state);
    });

    this.playerService.repeatMode.subscribe(mode => {
      this.repeatMode.next(mode);
    });
  }

  setPlayerComponent(player: YoutubePlayerComponent) {
    this.playerService.setPlayerComponent(player);
  }

  addToPlaylist(video: any): void {
    if (!this.playlist.snappy.some(v => v.id === video.id)) {
      const newPlaylist = [...this.playlist.snappy, video];
      if (!this.isShuffled.snappy) this.originalPlaylist = [...newPlaylist];
      this.playlist.next(newPlaylist);

      // If playlist was empty before adding, start playing the new track
      if (this.playlist.snappy.length === 1) {
        this.setCurrentTrackIndex(0);
      }
    }
  }

  savePlaylist(playlistData: any) {

  }

  clearPlaylist(): void {
    this.playlist.next([]);
    this.originalPlaylist = [];
    this.currentTrackIndex.next(-1);
    this.clearSelection();
    this.playerService.stop();
  }

  removeTrack(track: any): void {
    const index = this.playlist.snappy.findIndex(t => t.id === track.id);
    if (index === -1) return;

    const newPlaylist = [
      ...this.playlist.snappy.slice(0, index),
      ...this.playlist.snappy.slice(index + 1),
    ];
    this.playlist.next(newPlaylist);

    if (this.currentTrackIndex.snappy === index) {
      this.playerService.stop();
      this.setCurrentTrackIndex(-1);
    } else if (this.currentTrackIndex.snappy > index) {
      this.setCurrentTrackIndex(this.currentTrackIndex.snappy - 1);
    }

    if (!this.isShuffled.snappy) {
      this.originalPlaylist = [...newPlaylist];
    } else {
      this.originalPlaylist = this.originalPlaylist.filter(t => t.id !== track.id);
    }

    // Remove track from selection if selected and update indexes
    const selected = new Set(this.selectedTrackIndexes.snappy);
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

    this.selectedTrackIndexes.next(updatedSelection);
  }

  removeSelectedTracks(): void {
    const selected = this.selectedTrackIndexes.snappy;
    if (selected.size === 0) return;

    const wasPlaying = this.playbackState$.snappy === 'playing';
    const currentIndex = this.currentTrackIndex.snappy;
    const isCurrentRemoved = selected.has(currentIndex);

    const newPlaylist = this.playlist.snappy.filter((_, idx) => !selected.has(idx));
    this.playlist.next(newPlaylist);

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
    if (this.isShuffled.snappy) {
      this.originalPlaylist = newOrder;
    }
    this.playlist.next(newOrder);
  }

  play(): void {
    if (this.playlist.snappy.length === 0) return;

    if (
      this.currentTrackIndex.snappy == null ||
      this.currentTrackIndex.snappy >= this.playlist.snappy.length
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

  setCurrentTrackIndex(index: number): void {
    const oldIndex = this.currentTrackIndex.snappy;
    this.currentTrackIndex.next(index);

    const selected = new Set(this.selectedTrackIndexes.snappy);
    const wasSingleSelected = selected.size === 1 && selected.has(oldIndex);

    if (oldIndex !== index && oldIndex >= 0) {
        if (wasSingleSelected) {
            // Case 1: Only the old track was selected
            selected.delete(oldIndex);
            if (index >= 0) {
                selected.add(index);
            }
            this.selectedTrackIndexes.next(selected);
        } else if (selected.has(oldIndex) && !selected.has(index)) {
            // Case 2: Old track was part of multi-selection, new track isn't selected
            // Keep the multi-selection but ensure new track is selected too
            selected.add(index);
            this.selectedTrackIndexes.next(selected);
        } else {
            this.selectedTrackIndexes.next(selected);
        }
        // Case 3: New track is already selected (part of multi-selection) - do nothing
        // Case 4: No tracks were selected - do nothing
    }
  }

  next(): void {
      if (this.playlist.snappy.length === 0) return;

      if (this.repeatMode.snappy === 'none' &&
          this.currentTrackIndex.snappy >= this.playlist.snappy.length - 1) {
          this.stop();
          this.setCurrentTrackIndex(-1);
          return; // Don't clear selection here
      }

      const nextIndex = this.repeatMode.snappy === 'one'
          ? this.currentTrackIndex.snappy
          : this.getNextTrackIndex(this.currentTrackIndex.snappy);

      this.clearSelection();
      this.selectTrack(nextIndex);
      this.setCurrentTrackIndex(nextIndex);
      this.playCurrentTrack();
  }

  previous(): void {
      if (this.playlist.snappy.length === 0) return;

      if (this.repeatMode.snappy === 'none' && this.currentTrackIndex.snappy <= 0) {
          this.stop();
          this.setCurrentTrackIndex(-1);
          return; // Don't clear selection here
      }

      const prevIndex = this.repeatMode.snappy === 'one'
          ? this.currentTrackIndex.snappy
          : this.getPreviousTrackIndex(this.currentTrackIndex.snappy);

      this.clearSelection();
      this.selectTrack(prevIndex);
      this.setCurrentTrackIndex(prevIndex);
      this.playCurrentTrack();
  }

  getCurrentTrack(): any | null {
    return this.playlist.snappy[this.currentTrackIndex.snappy] || null;
  }

  getCurrentTrackIndex(): number {
    return this.currentTrackIndex.snappy;
  }

  getPlaylist(): any[] {
    return this.playlist.snappy;
  }

  setRepeatMode(mode: 'none' | 'all' | 'one'): void {
    this.playerService.setRepeatMode(mode);
  }

  getRepeatMode(): 'none' | 'all' | 'one' {
    return this.playerService.getRepeatMode();
  }

  setShuffleState(shuffled: boolean): void {
    if (shuffled && !this.isShuffled.snappy) {
      this.originalPlaylist = [...this.playlist.snappy];
      this.playlist.next(this.shuffleArray([...this.playlist.snappy]));
      this.isShuffled.next(true);
    } else if (!shuffled && this.isShuffled.snappy) {
      const currentTrack = this.playlist.snappy[this.currentTrackIndex.snappy];
      const newIndex = this.originalPlaylist.findIndex(t => t.id === currentTrack.id);
      this.playlist.next([...this.originalPlaylist]);
      if (newIndex >= 0) this.setCurrentTrackIndex(newIndex);
      this.isShuffled.next(false);
    }
  }

  toggleMenu() {
    this.menuButtonPressed.next();
  }

  isPlaylistShuffled(): boolean {
    return this.isShuffled.snappy;
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
    const selected = new Set(this.selectedTrackIndexes.snappy);

    if (shiftKey && this.lastSelectedIndex !== null) {
      const start = Math.min(this.lastSelectedIndex, index);
      const end = Math.max(this.lastSelectedIndex, index);

      for (let i = start; i <= end; i++) {
        selected.add(i); // Always add, never toggle or remove
      }
    } else if (ctrlKey) {
      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }
      this.lastSelectedIndex = index;
    } else {
      selected.clear();
      selected.add(index);
      this.lastSelectedIndex = index;
    }

    this.selectedTrackIndexes.next(selected);
  }

  unselectTrack(index: number): void {
    const selected = new Set(this.selectedTrackIndexes.snappy);
    if (selected.has(index)) {
      selected.delete(index);
      this.selectedTrackIndexes.next(selected);
    }
  }

  clearSelection(): void {
    this.selectedTrackIndexes.next(new Set());
    this.lastSelectedIndex = null;
  }

  getSelectedTracks(): any[] {
    const selected = this.selectedTrackIndexes.snappy;
    return this.playlist.snappy.filter((_, idx) => selected.has(idx));
  }

  isTrackSelected(index: number): boolean {
    return this.selectedTrackIndexes.snappy.has(index);
  }

  // ========== Private helper methods ==========

  private getNextTrackIndex(currentIndex: number): number {
    return currentIndex >= this.playlist.snappy.length - 1
      ? this.repeatMode.snappy === 'all'
        ? 0
        : currentIndex
      : currentIndex + 1;
  }

  private getPreviousTrackIndex(currentIndex: number): number {
    return currentIndex <= 0
      ? this.repeatMode.snappy === 'all'
        ? this.playlist.snappy.length - 1
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
