import { Injectable } from "@angular/core";
import { YoutubePlayerComponent } from "../components/youtube-player/youtube-player.component";
import { createUpdater } from "../utils/stateUpdater";

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  playbackState = createUpdater<'playing' | 'paused' | 'stopped'>('stopped');
  repeatMode = createUpdater<'none' | 'all' | 'one'>('none');
  isHidden = createUpdater<boolean>(true);

  private player: YoutubePlayerComponent | null = null;

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
    if(this.isHidden.value !== true) {
      this.isHidden.set(true);
    }
  }

  show(): void {
    if(this.isHidden.value !== false) {
      this.isHidden.set(false);
    }
  }
}
