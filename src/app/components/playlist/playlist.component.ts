import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PlaylistService } from 'src/app/services/playlist.service';

@Component({
  selector: 'app-playlist',
  template: `
    <ion-list id="playlist">
      <ion-list-header>Playlist</ion-list-header>

      <app-playlist-track
        *ngFor="let track of playlist"
        [track]="track"
        (trackSelected)="selectTrack($event)"
      ></app-playlist-track>
    </ion-list>
  `,
  styleUrls: ['playlist.component.scss'],
  standalone: false
})
export class PlaylistComponent {
  @Input() playlist: any[] = [];
  @Output() trackSelected = new EventEmitter<any>();

  constructor(private playlistService: PlaylistService) {
  }

  ngOnInit(): void {
    // Subscribe to the playlist observable
    this.playlistService.playlist$.subscribe((playlist) => {
      this.playlist = playlist;
    });
  }

  selectTrack(track: any): void {
    this.trackSelected.emit(track); // Emit the selected track to the parent component
  }
}
