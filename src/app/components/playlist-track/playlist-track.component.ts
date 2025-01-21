import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-playlist-track',
  template: `
    <ion-item (click)="selectTrack()">
      <ion-label>{{ track.title }}</ion-label>
    </ion-item>
  `,
  styleUrls: ['./playlist-track.component.scss'],
  standalone: false,
})
export class PlaylistTrackComponent {
  @Input() track: { title: string; id: string } = { title: "", id: ""}; // Accept a track with a title and id
  @Output() trackSelected = new EventEmitter<string>();

  selectTrack() {
    this.trackSelected.emit(this.track.id);
  }

  constructor() {

  }
}
