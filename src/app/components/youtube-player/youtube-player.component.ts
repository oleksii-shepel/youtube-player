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
} from '@angular/core';
import {
  YoutubePlayerService,
  defaultSizes
} from './youtube-player.service';
import { IPlayerOutputs } from './types'; // Import the IPlayerOutputs interface

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'youtube-player',
  template: `
    <div #playerContainer style="width: 100%; height: 100%; min-height: 270px;"></div>
  `,
  providers: [YoutubePlayerService],
})
export class YoutubePlayerComponent implements AfterContentInit, OnDestroy {
  @Input() videoId = '';
  @Input() protocol: string = this.getProtocol();
  @Input() playerVars: YT.PlayerVars = {};

  @Output() ready = new EventEmitter<YT.Player>(); // Emits when the player is ready
  @Output() change = new EventEmitter<YT.PlayerEvent>(); // Emits when the player's state changes
  @Output() videoEnded = new EventEmitter<void>(); // Emits when the video ends

  @ViewChild('playerContainer', { static: true }) playerContainer!: ElementRef;

  private player: YT.Player | null = null;
  private playerId: string = '';
  private hasEnded = false;

  constructor(
    public playerService: YoutubePlayerService,
    private renderer: Renderer2
  ) {}

  ngAfterContentInit() {
    this.initializePlayer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['videoId'] && !changes['videoId'].firstChange) {
      this.initializePlayer();
    }
  }

  ngOnDestroy() {
    if (this.player) {
      this.player.destroy();
    }
  }

  private initializePlayer() {
    if (this.player) {
      this.player.destroy();
    }

    this.playerId = this.playerService.generateUniqueId();
    const container = this.playerContainer.nativeElement;
    const playerSize = {
      width: container.offsetWidth, // Set to 100% width of the container
      height: Math.min(defaultSizes.height, container.offsetHeight), // Maintain the provided height
    };

    // Set the ID of the player container dynamically
    this.renderer.setAttribute(this.playerContainer.nativeElement, 'id', this.playerId);

    this.playerService.loadPlayerApi({
      protocol: this.protocol
    });

    // Define the outputs object
    const outputs: IPlayerOutputs = {
      ready: this.ready,
      change: this.change,
    };

    this.playerService.setupPlayer(
      this.playerId,
      outputs, // Pass the outputs object
      playerSize,
      this.videoId,
      this.playerVars
    );

    // Subscribe to the ready event to store the player instance
    this.ready.subscribe((player: YT.Player) => {
      this.player = player;
    });

    // Subscribe to the change event to handle video end
    this.change.subscribe((event: YT.PlayerEvent) => {
      this.handlePlayerStateChange(event);
    });
  }

  private handlePlayerStateChange(event: any): void {
    if (event.data === YT.PlayerState.ENDED && !this.hasEnded) {
      this.hasEnded = true; // Mark the video as ended
      this.videoEnded.emit(); // Emit the videoEnded event
    } else if (event.data !== YT.PlayerState.ENDED) {
      this.hasEnded = false; // Reset the ended flag if the video is not in the ENDED state
    }
  }

  private getProtocol() {
    const hasWindow = window && window.location;
    const protocol = hasWindow
      ? window.location.protocol.replace(':', '')
      : 'http';
    return protocol;
  }
}
