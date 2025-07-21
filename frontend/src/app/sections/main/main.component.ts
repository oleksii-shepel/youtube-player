import { IonicModule } from '@ionic/angular';

import {
  Component,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import { PlaylistService } from '../../services/playlist.service';
import { YoutubePlayerComponent } from '../../components/youtube-player/youtube-player.component';
import { Subscription } from '@actioncrew/streamix';
import { PlayerService } from 'src/app/services/player.service';
import { RecorderService } from 'src/app/services/recorder.service';
import { PlaylistComponent } from '../../components/playlist/playlist.component';
import { RecorderComponent } from '../../components/recorder/recorder.component';
import { RouterModule } from '@angular/router';

declare const YT: any;

@Component({
  selector: 'app-main',
  template: `
    <div id="mainContainer">
      <youtube-player
        #youtubePlayer
        [isHidden]="isPlayerHidden"
        [videoId]="selectedVideoId"
        (videoEnded)="onPlayerVideoEnded()"
        (change)="onPlayerStateChange($event)"
      ></youtube-player>

      <app-recorder [isHidden]="isRecorderHidden"></app-recorder>

      <ion-split-pane contentId="main-content" #splitPane>
        <ion-menu
          contentId="main-content"
          type="overlay"
          menuId="main-menu"
          [class.overlay-active]="isOverlayMenuVisible"
        >
          <div class="content">
            <app-playlist class="expandable-list"></app-playlist>
          </div>
        </ion-menu>

        <div id="main-content">
          <ion-router-outlet></ion-router-outlet>
        </div>
      </ion-split-pane>
    </div>
  `,
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    PlaylistComponent,
    YoutubePlayerComponent,
    RecorderComponent,
    RouterModule
],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  selectedVideoId = '';
  isCompact = true;
  isPlayerHidden = true;
  isRecorderHidden = true;
  currentPlayerState: number = -1;
  isDragOverlayActive = true;

  @ViewChild('youtubePlayer', { static: true }) youtubePlayer:
    | YoutubePlayerComponent
    | undefined;
  @ViewChild('splitPane', { read: ElementRef }) splitPaneRef!: ElementRef;
  isOverlayMenuVisible = false;

  private subscriptions: Subscription[] = [];

  constructor(
    public playlistService: PlaylistService,
    public playerService: PlayerService,
    public recorderService: RecorderService
  ) {}

  ngAfterViewInit(): void {
    this.playlistService.setPlayerComponent(this.youtubePlayer!);

    this.subscriptions.push(
      this.playerService.isHidden$.subscribe((value) => {
        this.isPlayerHidden = value;
      })
    );

    this.subscriptions.push(
      this.recorderService.isHidden$.subscribe((value) => {
        this.isRecorderHidden = value;
      })
    );

    this.subscriptions.push(
      this.playlistService.menuButtonPressed.subscribe(async () => {
        const menu = document.querySelector('ion-menu')!;
        const splitPane = document.querySelector(
          'ion-split-pane.split-pane-visible'
        )!;

        if (splitPane) {
          menu.classList.toggle('hide-menu');
        } else {
          menu.toggle();
        }
      })
    );

    this.subscriptions.push(
      this.playlistService.currentTrackIndex.subscribe((index) => {
        const track = this.playlistService.getPlaylist()[index];
        if (track && track.id !== this.selectedVideoId) {
          this.selectedVideoId = track.id;
          if (this.youtubePlayer) {
            this.youtubePlayer.videoId = this.selectedVideoId;
          }
        }
      })
    );

    const menu = document.querySelector('ion-menu');

    if (menu) {
      menu.addEventListener('ionMenuDidOpen', async () => {
        const isSplit = await this.splitPaneRef.nativeElement.when();
        this.isOverlayMenuVisible = !isSplit;
      });

      menu.addEventListener('ionMenuDidClose', () => {
        this.isOverlayMenuVisible = false;
      });
    }
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
    } else if (
      event.data === YT.PlayerState.PLAYING ||
      event.data === YT.PlayerState.UNSTARTED ||
      event.data === YT.PlayerState.BUFFERING
    ) {
      this.playlistService.play();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
