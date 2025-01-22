import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  playlist: any[] = [];

  selectedVideoId: any = undefined;

  constructor() {}

  selectTrack(track: any) {
    this.selectedVideoId = track.id;
  }
}
