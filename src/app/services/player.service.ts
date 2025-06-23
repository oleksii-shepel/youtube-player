import { Injectable } from '@angular/core';
import { createUpdater } from '../utils/stateUpdater';
import { YoutubePlayerComponent } from '../components/youtube-player/youtube-player.component';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  playbackState = createUpdater<'playing' | 'paused' | 'stopped'>('stopped');
  repeatMode = createUpdater<'none' | 'all' | 'one'>('none');

  private player: YoutubePlayerComponent | null = null;
  private isHidden = false;

  constructor() {}

  setPlayerComponent(player: YoutubePlayerComponent) {
    this.player = player;
  }

  playVideo(videoId: string): void {
    if (this.player) {
      this.player.playVideo(videoId);
      this.playbackState.set('playing');
    }
  }

  pause(): void {
    this.playbackState.set('paused');
    this.player?.pauseVideo();
  }

  stop(): void {
    this.playbackState.set('stopped');
    this.player?.stopVideo();
  }

  setRepeatMode(mode: 'none' | 'all' | 'one'): void {
    this.repeatMode.set(mode);
  }

  getRepeatMode(): 'none' | 'all' | 'one' {
    return this.repeatMode.value;
  }

  hide(): void {
    if (this.isHidden || !this.player) return;
    this.isHidden = true;

    const iframe = document.querySelector('youtube-player.player') as HTMLElement;
    if (iframe) {
      iframe.style.position = 'absolute';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
    }
  }

  show(): void {
    if (!this.isHidden || !this.player) return;
    this.isHidden = false;

    const iframe = document.querySelector('youtube-player.player') as HTMLElement;
    if (iframe) {
      iframe.style.position = 'relative';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.opacity = '1';
      iframe.style.pointerEvents = '';
    }
  }
}
