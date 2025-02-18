import { Injectable } from '@angular/core';
import { createBehaviorSubject } from '@actioncrew/streamix';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  private playlist = createBehaviorSubject<any[]>([]);
  playlist$ = this.playlist;

  private currentTrackIndex = createBehaviorSubject<number>(0);
  currentTrackIndex$ = this.currentTrackIndex;

  // Add a video to the playlist
  addToPlaylist(video: any): void {
    const currentPlaylist = this.playlist.value()!;
    if (!currentPlaylist.includes(video)) {
      this.playlist.next([...currentPlaylist, video]);
    }
  }

  // Get the current playlist
  getPlaylist(): any[] {
    return this.playlist.value()!;
  }

  // Set the current track index
  setCurrentTrackIndex(index: number): void {
    this.currentTrackIndex.next(index);
  }

  // Get the current track index
  getCurrentTrackIndex(): number {
    return this.currentTrackIndex.value()!;
  }

  // Get the next track index
  getNextTrackIndex(currentIndex: number): number {
    const playlist = this.getPlaylist();
    return (currentIndex + 1) % playlist.length; // Loop back to the first track if the end is reached
  }

  // Get the previous track index
  getPreviousTrackIndex(currentIndex: number): number {
    const playlist = this.getPlaylist();
    return (currentIndex - 1 + playlist.length) % playlist.length; // Loop back to the last track if the beginning is reached
  }

  // Shuffle the playlist
  shufflePlaylist(): void {
    const playlist = this.getPlaylist();
    this.playlist.next(this.shuffleArray(playlist));
  }

  // Shuffle helper function (Fisher-Yates)
  private shuffleArray(array: any[]): any[] {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
    }
    return shuffled;
  }
}
