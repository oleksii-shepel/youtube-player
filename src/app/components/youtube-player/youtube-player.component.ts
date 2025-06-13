import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  NgZone
} from '@angular/core';
import {
  IPlayerOutputs,
  YouTubeRef,
  YoutubePlayerService,
  defaultSizes
} from '../../services/youtube-player.service';
import { createReplaySubject, Subscription } from '@actioncrew/streamix';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'youtube-player',
  template: `
    <div #playerContainer style="width: 100%; height: 100%; min-height: 270px;"></div>
  `,
})
export class YoutubePlayerComponent implements AfterContentInit, OnDestroy {
  @Input() videoId = '';
  @Input() protocol = this.getProtocol();
  @Input() playerVars: YT.PlayerVars = {};

  @Output() ready = new EventEmitter<YT.Player>();
  @Output() change = new EventEmitter<YT.PlayerEvent>();
  @Output() videoEnded = new EventEmitter<void>();

  @ViewChild('playerContainer', { static: true }) playerContainer!: ElementRef;

  private player: YT.Player | null = null;
  private playerId = '';
  private hasEnded = false;

  private playerOutputs: IPlayerOutputs;
  private subs: Subscription[] = [];

  constructor(
    public playerService: YoutubePlayerService,
    private renderer: Renderer2,
    private zone: NgZone
  ) {
    this.playerOutputs = {
      ready: createReplaySubject<YT.Player>(1),
      change: createReplaySubject<YT.PlayerEvent>(1),
    };

    this.subs.push(this.playerOutputs.ready.subscribe((player: YT.Player) => {
      this.zone.run(() => {
        this.player = player;
        this.ready.emit(player);
      });
    }));

    this.subs.push(this.playerOutputs.change.subscribe((event: YT.PlayerEvent & any) => {
      this.zone.run(() => {
        this.change.emit(event);
        this.handlePlayerStateChange(event);
      });
    }));
  }

  ngAfterContentInit() {
    this.initializePlayer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['videoId'] && !changes['videoId'].firstChange) {
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
      this.initializePlayer();
    }
  }

  ngOnDestroy() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.playerOutputs.ready.complete();
    this.playerOutputs.change.complete();
  }

  private initializePlayer() {
    this.playerId = this.playerService.generateUniqueId();
    this.renderer.setAttribute(this.playerContainer.nativeElement, 'id', this.playerId);

    const container = this.playerContainer.nativeElement;
    const playerSize = {
      width: container.offsetWidth,
      height: Math.min(defaultSizes.height, container.offsetHeight)
    };

    this.playerService.loadPlayerApi({ protocol: this.protocol });

    this.playerService.api.subscribe(() => {
      if (!this.player) {
        this.player = this.playerService.createPlayer(
          this.playerId,
          this.playerOutputs,
          playerSize,
          this.videoId,
          this.playerVars
        );
      } else if (this.videoId && this.player.getVideoData().video_id !== this.videoId) {
        this.playerService.playVideo({ id: { videoId: this.videoId } }, this.player);
      }
    });
  }

  private handlePlayerStateChange(event: YT.PlayerEvent & any): void {
    const YT = YouTubeRef();

    if (event.data === YT.PlayerState.ENDED) {
      if (!this.hasEnded) {
        this.hasEnded = true;
        this.videoEnded.emit();
      }
    } else if (event.data === YT.PlayerState.PLAYING) {
      this.hasEnded = false;
    }
  }

  private getProtocol(): "http" | "https" {
    const hasWindow = typeof window !== 'undefined' && window.location;
    const protocol = hasWindow ? window.location.protocol.replace(':', '') : 'http';
    return protocol as "http" | "https";
  }

  // Public methods to control player externally

  playVideo(videoId: string) {
    if (this.player) {
      this.playerService.playVideo({ id: { videoId } }, this.player);
    } else {
      this.videoId = videoId;
      this.initializePlayer();
    }
  }

  pauseVideo() {
    if (this.player) {
      this.playerService.pause(this.player);
    }
  }

  stopVideo() {
    if (this.player) {
      this.playerService.stopVideo(this.player);
    }
  }

  getCurrentPlayer(): YT.Player | null {
    return this.player;
  }

  getVideoData(): YT.VideoData | null {
    if (this.player && typeof this.player.getVideoData === 'function') {
      try {
        return this.player.getVideoData();
      } catch (e) {
        console.warn('Error getting video data from player:', e);
        return null;
      }
    }
    return null;
  }
}
