import { Injectable } from "@angular/core";
import { YoutubePlayerComponent } from "../components/player/youtube-player.component";
import { createBehaviorSubject } from "@actioncrew/streamix";

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  playbackState = createBehaviorSubject<'playing' | 'paused' | 'stopped'>('stopped');
  repeatMode = createBehaviorSubject<'none' | 'all' | 'one'>('none');
  isHidden$ = createBehaviorSubject<boolean>(true);

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
      this.playbackState.next('playing');
    }
  }

  pause(): void {
    this.playbackState.next('paused');
    this.player?.pauseVideo();
  }

  stop(): void {
    this.playbackState.next('stopped');
    this.player?.stopVideo();
  }

  setRepeatMode(mode: 'none' | 'all' | 'one'): void {
    this.repeatMode.next(mode);
  }

  getRepeatMode(): 'none' | 'all' | 'one' {
    return this.repeatMode.snappy;
  }

  hide(): void {
    if(this.isHidden$.snappy !== true) {
      this.isHidden$.next(true);
    }
  }

  show(): void {
    if(this.isHidden$.snappy !== false) {
      this.isHidden$.next(false);
    }
  }
}
