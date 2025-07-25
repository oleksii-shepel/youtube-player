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

import { IonicModule } from '@ionic/angular';
import { DirectiveModule } from 'src/app/directives';

@Component({
  standalone: true,
  selector: 'youtube-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, DirectiveModule],
  template: ` <div
      class="modal-container"
      [appDraggable]="draggable"
      [appResizable]="resizable"
      [preserveAspectRatio]="false"
      [class.with-border]="showBorder"
      [class.hidden]="isHidden"
      >
      @if (draggable) {
        <div
          class="drag-overlay"
          (click)="$event.stopPropagation()"
        ></div>
      }

      <div #playerContainer id="playerContainer" (click)="selectVisualPreset()"></div>

      @if (showButtons) {
        <div class="custom-buttons">
          <ion-button expand="block" fill="clear" (click)="toggleMode()">
            @if (mode === 'youtube') {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-projector-icon lucide-projector"><path d="M5 7 3 5"/><path d="M9 6V3"/><path d="m13 7 2-2"/><circle cx="9" cy="13" r="3"/><path d="M11.83 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.17"/><path d="M16 16h2"/></svg>
            }
            @if (mode === 'butterchurn') {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-no-axes-column-icon lucide-chart-no-axes-column"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
            }
            @if (mode === 'bars') {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-youtube-icon lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            }
          </ion-button>
          <ion-button expand="block" fill="clear" (click)="togglePin()">
            @if (draggable && resizable) {
              <svg
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
              }
              @if (!draggable || !resizable) {
                <svg
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
                }
              </ion-button>
              <ion-button
                (click)="closeModal()"
                fill="solid"
                color="primary"
                class="close-btn"
                >
                <ion-icon name="close" slot="start"></ion-icon>
                Close
              </ion-button>
            </div>
          }
        </div>`,

  styles: [`
    .modal-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 375px;
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
        min-width: inherit;
        min-height: inherit;
        position: absolute;
        height: 1px;
        width: 1px;
        left: 0;
        top: 0;
        padding: 0;
        border: 0;
        margin: 0;
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
  @Input() draggable = false;
  @Input() resizable = false;

  @Input() showButtons = true;
  @Input() showBorder = true;
  @Input() isHidden = true;
  @Input() mode: 'youtube' | 'butterchurn' | 'bars' = 'bars';

  @Output() close = new EventEmitter<void>();

  isDragOverlayActive = false;

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

  selectVisualPreset() {
    if(this.mode === 'butterchurn') {
      const iframe = document.getElementById(`${this.playerId}`) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'CONTROL',
            action: 'loadRandomPreset'
          },
          '*'
        );
      }
    }
  }

  toggleMode() {
    if (!this.playerId) return;

    const iframe = document.getElementById(`${this.playerId}`) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {

      switch (this.mode) {
        case 'youtube':
          this.mode = 'butterchurn';
          break;
        case 'butterchurn':
          this.mode = 'bars';
          break;
        case 'bars':
          this.mode = 'youtube';
          break;
      }

      iframe.contentWindow.postMessage(
        {
          type: 'CONTROL',
          action: 'setMode',
          mode: this.mode
        },
        '*'
      );
    }
  }

  togglePin() {
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
      width: "100%",
      height: "100%",
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

                // Wait for iframe to be fully ready before toggling mode
                this.waitForIframeReady().then(() => {
                  this.toggleMode();
                });
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

  private waitForIframeReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkIframe = () => {
        const iframe = document.getElementById(`${this.playerId}`) as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          resolve();
        } else {
          setTimeout(checkIframe, 50);
        }
      };
      checkIframe();
    });
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
