import { Component, ViewChild, AfterViewInit, OnDestroy, ElementRef, ViewContainerRef, Injector, ComponentRef } from '@angular/core';
import { PlaylistService } from '../../services/playlist.service';
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';
import { Subscription } from '@actioncrew/streamix';
import { PlayerService } from 'src/app/services/player.service';

declare const YT: any;

@Component({
  selector: 'app-root',
  template: `
    <ion-app id="mainContainer">
      <ng-template #playerModalTemplate>
        <div class="modal-overlay" [class.visible]="isOpen" [class.compact]="isCompact">
          <div class="backdrop" (click)="closeModal()" *ngIf="!isCompact"></div>
          <div class="modal-container" [class.hidden]="!isOpen" appDraggable appResizable [preserveAspectRatio]="false">
            <div class="drag-overlay"></div>
            <youtube-player
              #youtubePlayer
              [videoId]="selectedVideoId"
              (videoEnded)="onPlayerVideoEnded()"
              (change)="onPlayerStateChange($event)"
            ></youtube-player>
            <ion-button expand="block" (click)="closeModal()" *ngIf="!isCompact">Close</ion-button>
          </div>
        </div>
      </ng-template>

      <ng-container [class.visibility]="isOpen ? 'hidden' : 'visible'" [ngTemplateOutlet]="playerModalTemplate"></ng-container>

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
  isCompact = true;
  isOpen = false;
  currentPlayerState: number = -1;

  @ViewChild('youtubePlayer', { static: true }) youtubePlayer: YoutubePlayerComponent | undefined;
  private currentTrackSubscription: Subscription | null = null;
  private isHiddenSubscription: Subscription | null = null;

  constructor(
    public playlistService: PlaylistService,
    public playerService: PlayerService
  ) {
  }


  ngAfterViewInit(): void {
    this.playlistService.setPlayerComponent(this.youtubePlayer!);

    this.isHiddenSubscription = this.playerService.isHidden.subscribe((value) => {
      this.isOpen = !value;
    })

    this.currentTrackSubscription = this.playlistService.currentTrackIndex.subscribe(index => {
      const track = this.playlistService.getPlaylist()[index];
      if (track && track.id !== this.selectedVideoId) {
        this.selectedVideoId = track.id;
        if (this.youtubePlayer) {
          this.youtubePlayer.videoId = this.selectedVideoId;
        }
      }
    });
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
  }

  closeModal(): void {
    this.isOpen = false;
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

    if (this.isHiddenSubscription) {
      this.isHiddenSubscription.unsubscribe();
    }
  }
}
