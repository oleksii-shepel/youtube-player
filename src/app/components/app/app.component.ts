import { Component, ViewChild, AfterViewInit, OnDestroy, HostListener, Renderer2, ElementRef, ViewContainerRef, TemplateRef, Injector, ComponentRef } from '@angular/core';
import { PlaylistService } from '../../services/playlist.service';
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';
import { Subscription } from '@actioncrew/streamix';
import { PlaylistComponent } from '../playlist/playlist.component';

declare const YT: any; // Add this to access YT.PlayerState constants

@Component({
  selector: 'app-root',
  template: `
    <ion-app id="mainContainer">
      <div *ngIf="isOpen" class="modal-overlay">
        <div class="backdrop" (click)="closeModal()"></div>
        <div class="modal-container" appDraggable>
          <div class="drag-overlay"></div>
          <ng-container #modalPlayerHost></ng-container>
          <ion-button expand="block" (click)="closeModal()">Close</ion-button>
        </div>
      </div>

      <ion-split-pane contentId="main-content">
        <ion-menu contentId="main-content" type="overlay" menuId="main-menu">
          <div class="content">
            <app-playlist
              (trackSelected)="onTrackSelected($event)"
              (playlistPlayerHostReady)="onPlaylistPlayerHostReady($event)"
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
  currentPlayerState: number = -1;

  @ViewChild('modalPlayerHost', { read: ViewContainerRef }) modalPlayerHost!: ViewContainerRef;
  private playlistPlayerHost: ViewContainerRef | null = null;

  private youtubePlayerComponentRef: ComponentRef<YoutubePlayerComponent> | null = null;
  private currentTrackSubscription: Subscription | null = null;

  constructor(
    public playlistService: PlaylistService,
    private injector: Injector
  ) {}

  // This method is called by the <app-playlist> component when its host is ready
  onPlaylistPlayerHostReady(vcr: ViewContainerRef | any): void {
    this.playlistPlayerHost = vcr;
    // Now that we have the host, we can safely create and place the player
    this.createYoutubePlayer();
    this.openModalWithTrack();
  }

  ngAfterViewInit(): void {
    // Only subscribe to track changes here.
    // The player creation is now handled by onPlaylistPlayerHostReady.
    this.currentTrackSubscription = this.playlistService.currentTrackIndex.subscribe(index => {
      const track = this.playlistService.getPlaylist()[index];
      if (track && track.id !== this.selectedVideoId) {
        this.selectedVideoId = track.id;
        if (this.youtubePlayerComponentRef) {
          this.youtubePlayerComponentRef.instance.videoId = this.selectedVideoId;
          // If YoutubePlayerComponent uses OnPush strategy, you might need this:
          // this.youtubePlayerComponentRef.instance.cdr.detectChanges();
        }
      }
    });

    // Optionally, if you want a video to load even if no track is explicitly selected,
    // you could trigger the initial track selection here or in createYoutubePlayer.
    // For example:
    // if (this.playlistService.getPlaylist().length > 0 && !this.selectedVideoId) {
    //   this.playlistService.setCurrentTrackIndex(0);
    //   // Note: playlistService.play() might be called here or when a track is clicked.
    // }
  }

  private createYoutubePlayer(): void {
    // Crucial check: only create if the host is available and player doesn't already exist
    if (this.youtubePlayerComponentRef || !this.playlistPlayerHost) {
      return;
    }

    this.youtubePlayerComponentRef = this.playlistPlayerHost.createComponent(YoutubePlayerComponent, {
      injector: this.injector
    });

    // Bind outputs of the created component instance
    this.youtubePlayerComponentRef.instance.videoEnded.subscribe(() => this.onPlayerVideoEnded());
    this.youtubePlayerComponentRef.instance.change.subscribe((event) => this.onPlayerStateChange(event));

    // Set initial videoId if a track is already selected or playlist has content
    const initialTrackIndex = this.playlistService.getCurrentTrackIndex();
    const initialPlaylist = this.playlistService.getPlaylist();

    if (initialTrackIndex !== -1 && initialPlaylist[initialTrackIndex]) {
      this.selectedVideoId = initialPlaylist[initialTrackIndex].id;
      this.youtubePlayerComponentRef.instance.videoId = this.selectedVideoId;
    } else if (initialPlaylist.length > 0) {
      // If no track is 'current', but playlist has items, load the first one
      this.playlistService.setCurrentTrackIndex(0); // This will update selectedVideoId via subscription
      this.selectedVideoId = initialPlaylist[0].id;
      this.youtubePlayerComponentRef.instance.videoId = this.selectedVideoId;
    }
  }

  onTrackSelected(track: any): void {
    // Your existing logic for track selection
    const playlist = this.playlistService.getPlaylist();
    const trackIndex = playlist.findIndex(t => t.id === track.id);

    if (trackIndex >= 0) {
      this.playlistService.setCurrentTrackIndex(trackIndex);
      this.playlistService.play();
    }

    this.openModalWithTrack();
  }

  openModalWithTrack(): void {
    // Ensure the player exists before attempting to move it
    if (!this.youtubePlayerComponentRef) {
      // This should ideally not happen if createYoutubePlayer is called on host readiness
      // but serves as a fail-safe.
      this.createYoutubePlayer();
    }

    if (!this.youtubePlayerComponentRef || !this.playlistPlayerHost) return;

    const playerView = this.youtubePlayerComponentRef.hostView;

    // Detach from current host (playlistPlayerHost)
    const playerHostIndex = this.playlistPlayerHost.indexOf(playerView);
    if (playerHostIndex !== -1) {
      this.playlistPlayerHost.detach(playerHostIndex);
    }

    this.modalPlayerHost.clear(); // Clear modal host before inserting
    this.modalPlayerHost.insert(playerView); // Insert into modal host

    this.isOpen = true;
  }

  closeModal(): void {
    this.isOpen = false;

    if (!this.youtubePlayerComponentRef || !this.playlistPlayerHost) {
      return; // Player or playlist host not available to move back
    }

    const playerView = this.youtubePlayerComponentRef.hostView;

    // Detach from modal host
    const modalHostIndex = this.modalPlayerHost.indexOf(playerView);
    if (modalHostIndex !== -1) {
      this.modalPlayerHost.detach(modalHostIndex);
    }

    this.playlistPlayerHost.clear(); // Clear playlist host before inserting
    this.playlistPlayerHost.insert(playerView); // Insert back into playlist host
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
    } else if (event.data === YT.PlayerState.ENDED) {
      // Optional: handle ended state here or rely on videoEnded event
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
