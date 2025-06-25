import { PlayerService } from 'src/app/services/player.service';
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
  ViewChild
} from '@angular/core';
import { createReplaySubject, ReplaySubject, Subscription, take } from '@actioncrew/streamix';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DirectiveModule } from 'src/app/directives';

@Component({
  standalone: true,
  selector: 'youtube-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule, DirectiveModule],
  template: ` <div
    class="modal-container"
    [appDraggable]="draggable"
    [appResizable]="resizable"
    [preserveAspectRatio]="false"
    [class.with-border]="showBorder"
    [class.hidden]="isHidden"
  >
    <div
      class="drag-overlay"
      *ngIf="draggable"
      (click)="$event.stopPropagation()"
    ></div>

    <div #playerContainer id="playerContainer"></div>

    <div class="custom-buttons" *ngIf="showButtons">
      <ion-button expand="block" size="small" (click)="tooglePin()">
        <svg
          *ngIf="draggable && resizable"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-pin-icon lucide-pin"
        >
          <path d="M12 17v5" />
          <path
            d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
          />
        </svg>
        <svg
          *ngIf="!draggable || !resizable"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-pin-off-icon lucide-pin-off"
        >
          <path d="M12 17v5" />
          <path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" />
          <path d="m2 2 20 20" />
          <path
            d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"
          />
        </svg>
      </ion-button>
      <ion-button expand="block" size="small" (click)="closeModal()">Close</ion-button>
      <!-- Add more buttons here if needed -->
    </div>
  </div>`,

  styles: [`
    .modal-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      background: #1a1a1a;
      padding: 16px;
      border-radius: 12px;
      z-index: 1001;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: stretch;
      box-sizing: content-box;
      min-width: 232px;
      min-height: 232px;

      &.with-border {
        border: 2px solid #888;
      }

      &.hidden {
        position: absolute;
        height: 1px;
        width: 1px;
        opacity: 0.01;
        pointer-events: none;
        overflow: hidden;
      }
    }

    .drag-overlay {
      position: absolute;
      inset: 0;
      background: transparent;
      z-index: 10;
      pointer-events: auto;
      margin: 16px;
      margin-bottom: 64px;
    }

    .custom-buttons {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    #playerContainer {
      width: 100%;
      height: 100%;
      aspect-ratio: 16 / 9;
    }
  `],
})
export class YoutubePlayerComponent implements AfterContentInit, OnDestroy {
  @Input() draggable = true;
  @Input() resizable = true;

  @Input() showButtons = true;
  @Input() showBorder = true;
  @Input() isHidden = false;

  @Output() close = new EventEmitter<void>();

  isDragOverlayActive = true;

  @Input() videoId = '';
  @Input() protocol: 'http' | 'https' = this.getProtocol();
  @Input() playerVars: YT.PlayerVars = {};

  @Output() ready = new EventEmitter<boolean>();
  @Output() change = new EventEmitter<YT.PlayerEvent>();
  @Output() videoEnded = new EventEmitter<boolean>();

  @ViewChild('playerContainer', { static: true }) container!: ElementRef;

  private player: YT.Player | null = null;
  private playerId = '';
  private hasEnded = false;

  private api: ReplaySubject<any> = createReplaySubject(1);
  private subs: Subscription[] = [];

  constructor(private renderer: Renderer2, private zone: NgZone, private playerService: PlayerService) {
    this.setupYouTubeApi();
  }

  ngAfterContentInit() {
    this.loadPlayerApi();
    this.initializePlayer();
  }

  tooglePin() {
    this.draggable = !this.draggable;
    this.resizable = !this.resizable;
  }

  closeModal(): void {
    this.isHidden = true;
    this.playerService.hide();
  }

  ngOnDestroy() {
    this.cleanupPlayer();
  }

  private getProtocol(): 'http' | 'https' {
    const hasWindow = typeof window !== 'undefined' && window.location;
    return (hasWindow ? window.location.protocol.replace(':', '') : 'http') as
      | 'http'
      | 'https';
  }

  private setupYouTubeApi() {
    const win = window as any;

    if (!win['onYouTubeIframeAPIReady']) {
      win['onYouTubeIframeAPIReady'] = () => {
        win['onYouTubeIframeAPIReadyCalled'] = true;
        this.api.next(win['YT']);
      };
    }

    if (win['onYouTubeIframeAPIReadyCalled'] && win['YT']) {
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
    this.renderer.setAttribute(
      this.container.nativeElement,
      'id',
      this.playerId
    );

    const container = this.container.nativeElement;
    const playerSize = {
      width: container.offsetWidth,
      height: Math.min(container.offsetHeight || 270, 270),
    };

    this.subs.push(
      this.api.pipe(take(1)).subscribe((YT: typeof window.YT) => {
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
            },
          },
        });
      })
    );
  }

  private cleanupPlayer() {
    this.subs.forEach((sub) => sub.unsubscribe());
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
      const currentVideoId = this.getVideoData()?.video_id;
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
    this.isHidden = true;
    this.renderer.addClass(this.container.nativeElement, 'hidden');
  }

  show() {
    this.isHidden = false;
    this.renderer.removeClass(this.container.nativeElement, 'hidden');
  }
}
