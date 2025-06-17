import { Injectable } from '@angular/core';
import { createUpdater } from '../utils/stateUpdater';
import { YoutubePlayerComponent } from '../components/youtube-player/youtube-player.component';

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
  originalPlaylist: any[] = [];

  // Reference to player component to control playback
  private currentPlayerComponent: YoutubePlayerComponent | null = null;

  constructor() {}

  setPlayerComponent(player: YoutubePlayerComponent) {
    this.currentPlayerComponent = player;
  }

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

  removeTrack(track: any): void {
    const index = this.playlist.value.findIndex(t => t.id === track.id);
    if (index === -1) return;

    const newPlaylist = [
      ...this.playlist.value.slice(0, index),
      ...this.playlist.value.slice(index + 1),
    ];
    this.playlist.set(newPlaylist);

    // Maintain current index logic
    if (this.currentTrackIndex.value === index) {
      this.stop();
      this.setCurrentTrackIndex(-1);
    } else if (this.currentTrackIndex.value > index) {
      this.setCurrentTrackIndex(this.currentTrackIndex.value - 1);
    }

    if (!this.isShuffled.value) {
      this.originalPlaylist = [...newPlaylist];
    } else {
      this.originalPlaylist = this.originalPlaylist.filter(t => t.id !== track.id);
    }
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
    this.playCurrentTrack();
  }

  pause(): void {
    this.playbackState.set('paused');
    this.currentPlayerComponent?.pauseVideo();
  }

  stop(): void {
    this.playbackState.set('stopped');
    this.currentPlayerComponent?.stopVideo();
  }

  next(): void {
    if (this.playlist.value.length === 0) return;

    const nextIndex =
      this.repeatMode.value === 'one'
        ? this.currentTrackIndex.value
        : this.getNextTrackIndex(this.currentTrackIndex.value);

    this.setCurrentTrackIndex(nextIndex);
    this.playCurrentTrack();
  }

  previous(): void {
    if (this.playlist.value.length === 0) return;

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
    this.repeatMode.set(mode);
  }

  getRepeatMode(): 'none' | 'all' | 'one' {
    return this.repeatMode.value;
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

  isPlaylistShuffled(): boolean {
    return this.isShuffled.value;
  }

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
    if (track && this.currentPlayerComponent) {
      this.currentPlayerComponent.playVideo(track.id);
      this.playbackState.set('playing');
    }
  }
}
