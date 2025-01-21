import { Component } from '@angular/core';
import { PlaylistService } from 'src/app/services/playlist.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  playlist: any[] = [];

  selectedVideoId: any = undefined;

  constructor(private playlistService: PlaylistService) {}

  ngOnInit(): void {
    // Subscribe to the playlist observable
    this.playlistService.playlist$.subscribe((playlist) => {
      this.playlist = playlist;
    });
  }

  selectTrack(track: any) {
    this.selectedVideoId = track.id;
  }
}
