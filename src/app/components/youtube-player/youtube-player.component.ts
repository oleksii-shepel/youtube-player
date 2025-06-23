import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { createReplaySubject, ReplaySubject, Subscription } from '@actioncrew/streamix';

@Component({
  standalone: true,
  selector: 'youtube-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #playerContainer style="width: 100%; height: 100%; min-height: 270px;"></div>`,
})
export class YoutubePlayerComponent implements AfterContentInit, OnDestroy {
  @Input() videoId = '';
  @Input() protocol: 'http' | 'https' = this.getProtocol();
  @Input() playerVars: YT.PlayerVars = {};

  @Output() ready = new EventEmitter<boolean>();
  @Output() change = new EventEmitter<YT.PlayerEvent>();
  @Output() videoEnded = new EventEmitter<boolean>();

  @ViewChild('playerContainer', { static: true }) playerContainer!: ElementRef;

  private player: YT.Player | null = null;
  private playerId = '';
  private hasEnded = false;
  private isHidden = false;

  private api: ReplaySubject<any> = createReplaySubject(1);
  private subs: Subscription[] = [];

  constructor(private renderer: Renderer2, private zone: NgZone) {
    this.setupYouTubeApi();
  }

  ngAfterContentInit() {
    this.loadPlayerApi();
    this.initializePlayer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['videoId'] && !changes['videoId'].firstChange) {
      this.cleanupPlayer();
      this.initializePlayer();
    }
  }

  ngOnDestroy() {
    this.cleanupPlayer();
  }

  private getProtocol(): 'http' | 'https' {
    const hasWindow = typeof window !== 'undefined' && window.location;
    return (hasWindow ? window.location.protocol.replace(':', '') : 'http') as 'http' | 'https';
  }

  private setupYouTubeApi() {
    const win = window as any;
    win['onYouTubeIframeAPIReady'] = () => {
      win['onYouTubeIframeAPIReadyCalled'] = true;
      this.api.next(win['YT']);
    };

    if (win['onYouTubeIframeAPIReadyCalled']) {
      this.api.next(win['YT']);
    }
  }

  private loadPlayerApi() {
    if (!(window as any)['YouTubeApiLoaded']) {
      (window as any)['YouTubeApiLoaded'] = true;
      const script = document.createElement('script');
      script.src = `${this.protocol}://www.youtube.com/iframe_api`;
      script.async = true;
      document.body.appendChild(script);
    }
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private initializePlayer() {
    this.playerId = this.generateUniqueId();
    this.renderer.setAttribute(this.playerContainer.nativeElement, 'id', this.playerId);

    const container = this.playerContainer.nativeElement;
    const playerSize = {
      width: container.offsetWidth,
      height: Math.min(container.offsetHeight || 270, 270)
    };

    this.subs.push(this.api.subscribe((YT: typeof window.YT) => {
      const Player = YT.Player;
      this.player = new Player(this.playerId, {
        ...playerSize,
        videoId: this.videoId,
        playerVars: this.playerVars,
        events: {
          onReady: (ev: YT.PlayerEvent) => {
            this.zone.run(() => {
              this.ready.emit(true);
              if (this.videoId && this.playerVars.autoplay !== 0) {
                ev.target.playVideo();
              }
            });
          },
          onStateChange: (ev: YT.OnStateChangeEvent) => {
            this.zone.run(() => {
              this.change.emit(ev);
              this.handlePlayerStateChange(ev);
            });
          }
        }
      });
    }));
  }

  private cleanupPlayer() {
    this.subs.forEach(sub => sub.unsubscribe());
    this.subs = [];

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    this.hasEnded = false;
  }

  private handlePlayerStateChange(event: YT.OnStateChangeEvent): void {
    const state = event.data;
    const YT = (window as any).YT;

    if (state === YT?.PlayerState.ENDED && !this.hasEnded) {
      this.hasEnded = true;
      this.videoEnded.emit(true);
    } else if (state === YT?.PlayerState.PLAYING) {
      this.hasEnded = false;
    }
  }

  // Public methods
  playVideo(videoId: string) {
    if (this.player) {
      const currentVideoId = this.player.getVideoData()?.video_id;
      if (currentVideoId === videoId) {
        this.player.playVideo();
      } else {
        this.player.loadVideoById(videoId);
      }
    } else {
      this.videoId = videoId;
      this.initializePlayer();
    }
  }

  pauseVideo() {
    this.player?.pauseVideo();
  }

  stopVideo() {
    this.player?.stopVideo();
  }

  getCurrentPlayer(): YT.Player | null {
    return this.player;
  }

  getVideoData(): YT.VideoData | null {
    try {
      return this.player?.getVideoData?.() ?? null;
    } catch {
      return null;
    }
  }

  hide() {
    if (this.isHidden) return;
    this.isHidden = true;

    // Keep playing, just hide visually
    this.renderer.setStyle(this.playerContainer.nativeElement, 'visibility', 'hidden');
    this.renderer.setStyle(this.playerContainer.nativeElement, 'width', '0');
    this.renderer.setStyle(this.playerContainer.nativeElement, 'height', '0');
    this.renderer.setStyle(this.playerContainer.nativeElement, 'overflow', 'hidden');
  }

  show() {
    if (!this.isHidden) return;
    this.isHidden = false;

    this.renderer.removeStyle(this.playerContainer.nativeElement, 'visibility');
    this.renderer.removeStyle(this.playerContainer.nativeElement, 'width');
    this.renderer.removeStyle(this.playerContainer.nativeElement, 'height');
    this.renderer.removeStyle(this.playerContainer.nativeElement, 'overflow');
  }
}
