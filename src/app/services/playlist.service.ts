import { Injectable } from '@angular/core';
import { createBehaviorSubject } from '@actioncrew/streamix';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  // Reactive state
  public playlist = createBehaviorSubject<any[]>([]);
  public currentTrackIndex = createBehaviorSubject<number>(0);
  public playbackState = createBehaviorSubject<'playing' | 'paused' | 'stopped'>('stopped');

  // Internal state
  private playlistValue: any[] = [];
  private currentTrackIndexValue = 0;
  private originalPlaylist: any[] = [];

  private isShuffled = false;
  private repeatMode: 'none' | 'all' | 'one' = 'none';

  constructor() {
    this.playlist.subscribe(value => this.playlistValue = value);
    this.currentTrackIndex.subscribe(value => this.currentTrackIndexValue = value);
  }

  // Playlist methods
  addToPlaylist(video: any): void {
    if (!this.playlistValue.some(v => v.id === video.id)) {
      const newPlaylist = [...this.playlistValue, video];
      this.playlistValue = newPlaylist;
      if (!this.isShuffled) this.originalPlaylist = [...newPlaylist];
      this.playlist.next(newPlaylist);
    }
  }

  clearPlaylist(): void {
    this.playlistValue = [];
    this.originalPlaylist = [];
    this.playlist.next([]);
    this.currentTrackIndex.next(0);
    this.playbackState.next('stopped');
  }

  updatePlaylistOrder(newOrder: any[]): void {
    if (this.isShuffled) {
      this.originalPlaylist = newOrder;
    }
    this.playlist.next(newOrder);
  }

  // Playback control
  play(): void {
    if (this.playlistValue.length === 0) return;

    // Ensure a valid current track index
    if (this.currentTrackIndexValue == null || this.currentTrackIndexValue >= this.playlistValue.length) {
      this.setCurrentTrackIndex(0);
    } else if (this.currentTrackIndexValue === 0) {
      this.setCurrentTrackIndex(0);
    }

    this.playbackState.next('playing');
  }

  pause(): void {
    this.playbackState.next('paused');
  }

  stop(): void {
    this.playbackState.next('stopped');
  }

  next(): void {
    if (this.playlistValue.length === 0) return;

    const nextIndex = this.repeatMode === 'one'
      ? this.currentTrackIndexValue
      : this.getNextTrackIndex(this.currentTrackIndexValue);

    this.setCurrentTrackIndex(nextIndex);
    this.play();
  }

  previous(): void {
    if (this.playlistValue.length === 0) return;

    const prevIndex = this.repeatMode === 'one'
      ? this.currentTrackIndexValue
      : this.getPreviousTrackIndex(this.currentTrackIndexValue);

    this.setCurrentTrackIndex(prevIndex);
    this.play();
  }

  setCurrentTrackIndex(index: number): void {
    this.currentTrackIndex.next(index);
  }

  getCurrentTrack(): any | null {
    return this.playlistValue[this.currentTrackIndexValue] || null;
  }

  getCurrentTrackIndex(): number {
    return this.currentTrackIndexValue;
  }

  getPlaylist(): any[] {
    return this.playlistValue;
  }

  // Repeat
  setRepeatMode(mode: 'none' | 'all' | 'one'): void {
    this.repeatMode = mode;
  }

  getRepeatMode(): 'none' | 'all' | 'one' {
    return this.repeatMode;
  }

  // Shuffle
  setShuffleState(shuffled: boolean): void {
    if (shuffled && !this.isShuffled) {
      this.originalPlaylist = [...this.playlistValue];
      this.playlist.next(this.shuffleArray([...this.playlistValue]));
      this.isShuffled = true;
    } else if (!shuffled && this.isShuffled) {
      const currentTrack = this.playlistValue[this.currentTrackIndexValue];
      const newIndex = this.originalPlaylist.findIndex(t => t.id === currentTrack.id);
      this.playlist.next([...this.originalPlaylist]);
      if (newIndex >= 0) this.setCurrentTrackIndex(newIndex);
      this.isShuffled = false;
    }
  }

  isPlaylistShuffled(): boolean {
    return this.isShuffled;
  }

  private getNextTrackIndex(currentIndex: number): number {
    return currentIndex >= this.playlistValue.length - 1
      ? (this.repeatMode === 'all' ? 0 : currentIndex)
      : currentIndex + 1;
  }

  private getPreviousTrackIndex(currentIndex: number): number {
    return currentIndex <= 0
      ? (this.repeatMode === 'all' ? this.playlistValue.length - 1 : currentIndex)
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
