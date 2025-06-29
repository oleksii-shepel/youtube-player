import { Component, ViewChild, AfterViewInit, OnDestroy, ElementRef, ViewContainerRef, Injector, ComponentRef, AfterContentInit } from '@angular/core';
import { PlaylistService } from '../../services/playlist.service';
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';
import { Subscription } from '@actioncrew/streamix';
import { PlayerService } from 'src/app/services/player.service';

declare const YT: any;

@Component({
  selector: 'app-root',
  template: `
    <ion-app id="mainContainer">
      <youtube-player
        #youtubePlayer
        [isHidden]="isHidden"
        [videoId]="selectedVideoId"
        (videoEnded)="onPlayerVideoEnded()"
        (change)="onPlayerStateChange($event)"
      ></youtube-player>

      <ion-split-pane contentId="main-content">
        <ion-menu contentId="main-content" type="overlay" menuId="main-menu">
          <div class="content">
            <app-playlist
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
  isHidden = true;
  currentPlayerState: number = -1;
  isDragOverlayActive = true;

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
      this.isHidden = value;
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

  disableDragOverlay() {
    this.isDragOverlayActive = false;
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
