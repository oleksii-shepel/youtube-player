import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  private playlist = new BehaviorSubject<any[]>([]);
  playlist$ = this.playlist.asObservable();

  // Add a video to the playlist
  addToPlaylist(video: any): void {
    const currentPlaylist = this.playlist.getValue();
    if(!currentPlaylist.includes(video)) {
      this.playlist.next([...currentPlaylist, video]);
    }
  }

  // Get the current playlist
  getPlaylist(): any[] {
    return this.playlist.getValue();
  }
}
