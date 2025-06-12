import { Injectable } from '@angular/core';
import { createUpdater } from '../utils/stateUpdater';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  // Reactive state
  public playlist = createUpdater<any[]>([]);
  public currentTrackIndex = createUpdater<number>(-1);
  public playbackState = createUpdater<'playing' | 'paused' | 'stopped'>('stopped');

  private isShuffled = createUpdater<boolean>(false);
  private repeatMode = createUpdater<'none' | 'all' | 'one'>('none');
  private originalPlaylist: any[] = [];

  constructor() { }

  // Playlist methods
  addToPlaylist(video: any): void {
    if (!this.playlist.value.some(v => v.id === video.id)) {
      const newPlaylist = [...this.playlist.value, video];
      if (!this.isShuffled.value) this.originalPlaylist = [...newPlaylist];
      this.playlist.set(newPlaylist);
    }
  }

  clearPlaylist(): void {
    this.playlist.set([]);
    this.originalPlaylist = [];
    this.currentTrackIndex.set(-1);
    this.playbackState.set('stopped');
  }

  updatePlaylistOrder(newOrder: any[]): void {
    if (this.isShuffled.value) {
      this.originalPlaylist = newOrder;
    }
    this.playlist.set(newOrder);
  }

  // Playback control
  play(): void {
    if (this.playlist.value.length === 0) return;

    // Ensure a valid current track index
    if (this.currentTrackIndex.value == null || this.currentTrackIndex.value >= this.playlist.value.length) {
      this.setCurrentTrackIndex(0);
    } else if (this.currentTrackIndex.value === 0) {
      this.setCurrentTrackIndex(0);
    }

    this.playbackState.set('playing');
  }

  pause(): void {
    this.playbackState.set('paused');
  }

  stop(): void {
    this.playbackState.set('stopped');
  }

  next(): void {
    if (this.playlist.value.length === 0) return;

    const nextIndex = this.repeatMode.value === 'one'
      ? this.currentTrackIndex.value
      : this.getNextTrackIndex(this.currentTrackIndex.value);

    this.setCurrentTrackIndex(nextIndex);
    this.play();
  }

  previous(): void {
    if (this.playlist.value.length === 0) return;

    const prevIndex = this.repeatMode.value === 'one'
      ? this.currentTrackIndex.value
      : this.getPreviousTrackIndex(this.currentTrackIndex.value);

    this.setCurrentTrackIndex(prevIndex);
    this.play();
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

  // Repeat
  setRepeatMode(mode: 'none' | 'all' | 'one'): void {
    this.repeatMode.set(mode);
  }

  getRepeatMode(): 'none' | 'all' | 'one' {
    return this.repeatMode.value;
  }

  // Shuffle
  setShuffleState(shuffled: boolean): void {
    if (shuffled && !this.isShuffled.value) {
      this.originalPlaylist = [...this.playlist.value];
      this.playlist.set(this.shuffleArray([...this.playlist.value]));
      this.isShuffled.set(true);
    } else if (!shuffled && this.isShuffled) {
      const currentTrack = this.playlist.value[this.currentTrackIndex.value];
      const newIndex = this.originalPlaylist.findIndex(t => t.id === currentTrack.id);
      this.playlist.set([...this.originalPlaylist]);
      if (newIndex >= 0) this.setCurrentTrackIndex(newIndex);
      this.isShuffled.set(false);
    }
  }

  isPlaylistShuffled(): boolean {
    return this.isShuffled.value;
  }

  private getNextTrackIndex(currentIndex: number): number {
    return currentIndex >= this.playlist.value.length - 1
      ? (this.repeatMode.value === 'all' ? 0 : currentIndex)
      : currentIndex + 1;
  }

  private getPreviousTrackIndex(currentIndex: number): number {
    return currentIndex <= 0
      ? (this.repeatMode.value === 'all' ? this.playlist.value.length - 1 : currentIndex)
      : currentIndex - 1;
  }

  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
