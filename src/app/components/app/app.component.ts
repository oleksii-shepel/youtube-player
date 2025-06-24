import { Component, ViewChild, AfterViewInit, OnDestroy, ElementRef, ViewContainerRef, Injector, ComponentRef } from '@angular/core';
import { PlaylistService } from '../../services/playlist.service';
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';
import { Subscription } from '@actioncrew/streamix';

declare const YT: any;

@Component({
  selector: 'app-root',
  template: `
    <ion-app id="mainContainer">
      <div class="modal-overlay" [class.visible]="isOpen" [class.compact]="isCompact">
        <div class="backdrop" (click)="closeModal()"  *ngIf="!isCompact"></div>
        <div class="modal-container" appDraggable>
          <div class="drag-overlay"></div>
          <youtube-player
            [videoId]="selectedVideoId"
            (videoEnded)="onPlayerVideoEnded()"
            (change)="onPlayerStateChange($event)"
          ></youtube-player>
          <ion-button expand="block" (click)="closeModal()" *ngIf="!isCompact">Close</ion-button>
        </div>
      </div>

      <ion-split-pane contentId="main-content">
        <ion-menu contentId="main-content" type="overlay" menuId="main-menu">
          <div class="content">
            <app-playlist
              (trackSelected)="onTrackSelected($event)"
              class="expandable-list"
            ></app-playlist>
          </div>
        </ion-menu>

        <div id="main-content">
          <ion-router-outlet></ion-router-outlet>
        </div>
      </ion-split-pane>
    </ion-app>
  `,
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements AfterViewInit, OnDestroy {
  selectedVideoId = '';
  isOpen = true;
  isCompact = true;
  currentPlayerState: number = -1;

  @ViewChild('modalPlayerHost') modalPlayerHost!: ElementRef;
  private playlistPlayerHost: ViewContainerRef | null = null;

  private youtubePlayerComponentRef: ComponentRef<YoutubePlayerComponent> | null = null;
  private currentTrackSubscription: Subscription | null = null;

  constructor(
    public playlistService: PlaylistService,
    private injector: Injector
  ) {}

  onPlaylistPlayerHostReady(vcr: ViewContainerRef | any): void {
    this.playlistPlayerHost = vcr;
    this.createYoutubePlayer();
  }

  ngAfterViewInit(): void {
    this.currentTrackSubscription = this.playlistService.currentTrackIndex.subscribe(index => {
      const track = this.playlistService.getPlaylist()[index];
      if (track && track.id !== this.selectedVideoId) {
        this.selectedVideoId = track.id;
        if (this.youtubePlayerComponentRef) {
          this.youtubePlayerComponentRef.instance.videoId = this.selectedVideoId;
        }
      }
    });
  }

  private createYoutubePlayer(): void {
    if (this.youtubePlayerComponentRef || !this.playlistPlayerHost) {
      return;
    }

    this.youtubePlayerComponentRef = this.playlistPlayerHost.createComponent(YoutubePlayerComponent, {
      injector: this.injector
    });

    // Bind outputs
    this.youtubePlayerComponentRef.instance.videoEnded.subscribe(() => this.onPlayerVideoEnded());
    this.youtubePlayerComponentRef.instance.change.subscribe((event) => this.onPlayerStateChange(event));

    this.playlistService.setPlayerComponent(this.youtubePlayerComponentRef.instance);

    // Set initial video
    const initialTrackIndex = this.playlistService.getCurrentTrackIndex();
    const initialPlaylist = this.playlistService.getPlaylist();

    if (initialTrackIndex !== -1 && initialPlaylist[initialTrackIndex]) {
      this.selectedVideoId = initialPlaylist[initialTrackIndex].id;
      this.youtubePlayerComponentRef.instance.videoId = this.selectedVideoId;
    } else if (initialPlaylist.length > 0) {
      this.playlistService.setCurrentTrackIndex(0);
      this.selectedVideoId = initialPlaylist[0].id;
      this.youtubePlayerComponentRef.instance.videoId = this.selectedVideoId;
    }
  }

  onTrackSelected(track: any): void {

    this.openModalWithTrack();

    setTimeout(() => {
      const playlist = this.playlistService.getPlaylist();
      const trackIndex = playlist.findIndex((t) => t.id === track.id);

      if (trackIndex >= 0) {
        this.playlistService.setCurrentTrackIndex(trackIndex);
        this.playlistService.play();
      }
    }, 500);
  }

  openModalWithTrack(): void {
    this.isOpen = true;

    // Move the actual iframe DOM element
    this.moveIframeToModal();
  }

  closeModal(): void {
    this.isOpen = false;

    // Move the iframe back to playlist
    this.moveIframeToPlaylist();
  }

  private moveIframeToModal(): void {
    // Find the YouTube iframe within the YoutubePlayerComponent
    const iframe = this.findYouTubeIframe();

    if (iframe && this.modalPlayerHost) {
      // Move the actual iframe element to modal
      this.modalPlayerHost.nativeElement.appendChild(iframe);
    }
  }

  private moveIframeToPlaylist(): void {
    this.playlistService.pause();

    setTimeout(() => {
      // Find the YouTube iframe
      const iframe = this.findYouTubeIframe();

      if (iframe && this.playlistPlayerHost && this.youtubePlayerComponentRef) {
        // Get the original container of the YoutubePlayerComponent
        const originalContainer = this.youtubePlayerComponentRef.location.nativeElement;

        // Move the iframe back to its original container
        originalContainer.appendChild(iframe);
      }

      this.playlistService.play();
    }, 1000);
  }

  private findYouTubeIframe(): HTMLIFrameElement | null {
    // Method 1: Find by YouTube iframe characteristics
    const iframes = document.querySelectorAll('iframe');

    for (let iframe of Array.from(iframes)) {
      if (iframe.src && iframe.src.includes('youtube.com/embed')) {
        return iframe;
      }
    }

    // Method 2: If your YoutubePlayerComponent has a specific structure
    if (this.youtubePlayerComponentRef) {
      const componentElement = this.youtubePlayerComponentRef.location.nativeElement;
      const iframe = componentElement.querySelector('iframe');
      return iframe;
    }

    // Method 3: Find by ID if your YoutubePlayerComponent sets one
    return document.getElementById('youtube-player-iframe') as HTMLIFrameElement;
  }

  onPlayerVideoEnded(): void {
    this.playlistService.next();
  }

  onPlayerStateChange(event: YT.PlayerEvent & any) {
    this.currentPlayerState = event.data;

    if (event.data === YT.PlayerState.PAUSED) {
      this.playlistService.pause();
    } else if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.UNSTARTED || event.data === YT.PlayerState.BUFFERING) {
      this.playlistService.play();
    }
  }

  ngOnDestroy() {
    if (this.currentTrackSubscription) {
      this.currentTrackSubscription.unsubscribe();
    }
    if (this.youtubePlayerComponentRef) {
      this.youtubePlayerComponentRef.destroy();
      this.youtubePlayerComponentRef = null;
    }
  }
}
