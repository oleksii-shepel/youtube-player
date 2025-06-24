import { Injectable } from "@angular/core";
import { YoutubePlayerComponent } from "../components/youtube-player/youtube-player.component";
import { createUpdater } from "../utils/stateUpdater";

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  playbackState = createUpdater<'playing' | 'paused' | 'stopped'>('stopped');
  repeatMode = createUpdater<'none' | 'all' | 'one'>('none');

  private player: YoutubePlayerComponent | null = null;
  private isHidden = false;

  // Store original styles to restore later
  private originalStyles: Partial<CSSStyleDeclaration> = {};

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

    const el =  document.querySelector('youtube-player') as HTMLElement;
    if (el) {
      // Save current styles you want to override
      this.originalStyles = {
        position: el.style.position,
        width: el.style.width,
        height: el.style.height,
        opacity: el.style.opacity,
        pointerEvents: el.style.pointerEvents,
      };

      // Apply hiding styles
      el.style.position = 'absolute';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.opacity = '0.01';
      el.style.pointerEvents = 'none';
    }
  }

  show(): void {
    if (!this.isHidden || !this.player) return;
    this.isHidden = false;

    const el =  document.querySelector('youtube-player') as HTMLElement;
    if (el) {
      // Restore saved styles exactly
      el.style.position = this.originalStyles.position || '';
      el.style.width = this.originalStyles.width || '';
      el.style.height = this.originalStyles.height || '';
      el.style.opacity = this.originalStyles.opacity || '';
      el.style.pointerEvents = this.originalStyles.pointerEvents || '';

      // Clear the saved styles cache
      this.originalStyles = {};
    }
  }
}
