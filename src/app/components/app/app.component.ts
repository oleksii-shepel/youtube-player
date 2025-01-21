import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  playlist = [
    { title: 'Track 1', id: 'qDuKsiwS5xw' },
    { title: 'Track 2', id: 'dQw4w9WgXcQ' },
    { title: 'Track 3', id: '3JZ_D3ELwOQ' },
  ];

  selectedVideoId = this.playlist[0].id;

  constructor() {}

  selectTrack(trackId: string) {
    this.selectedVideoId = trackId;
  }
}
