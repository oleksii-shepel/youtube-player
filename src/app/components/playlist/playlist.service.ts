import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { IPlayerOutputs, YoutubePlayerService } from '../youtube-player/youtube-player.service'; // Assuming this is where your YoutubePlayerService is
import { createReplaySubject } from '@actioncrew/streamix';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  private _playlist = new BehaviorSubject<any[]>([]);
  private _currentTrackIndex = new BehaviorSubject<number>(-1);
  private _playbackState = new BehaviorSubject<'playing' | 'paused' | 'stopped'>('stopped');
  private _isShuffled = new BehaviorSubject<boolean>(false);
  private _repeatMode = new BehaviorSubject<'none' | 'all' | 'one'>('none');

  private player: YT.Player | null = null;
  private originalPlaylist: any[] = []; // To store the original order for shuffling

  readonly playlist = this._playlist.asObservable();
  readonly currentTrackIndex = this._currentTrackIndex.asObservable();
  readonly playbackState = this._playbackState.asObservable();
  readonly isShuffled = this._isShuffled.asObservable();
  readonly repeatMode = this._repeatMode.asObservable();

  constructor(
    private youtubePlayerService: YoutubePlayerService,
    private zone: NgZone
  ) {
    // 1. Load the YouTube API script as soon as the service is instantiated
    this.youtubePlayerService.loadPlayerApi({ protocol: 'https' });

    // 2. Subscribe to the API ready signal. Once the API is ready, create the player.
    this.youtubePlayerService.api.subscribe((YT_API_READY: any) => {
      // Check if player is already created to avoid re-creation on hot module replacement etc.
      if (!this.player) {
        // Create the YouTube player instance
        // 'youtube-player' is the ID of the div element in your main player component
        this.player = this.youtubePlayerService.createPlayer(
          'youtube-player', // <--- Make sure you have a <div id="youtube-player"></div> in your HTML where the player should render
          {
            // These outputs are ReplaySubjects because they might emit before the subscriber is ready
            ready: createReplaySubject<YT.Player>(1),
            change: createReplaySubject<YT.PlayerEvent>(1),
          },
          { height: 270, width: 367 }, // Your desired default sizes
          '', // No initial videoId, as playlist service will handle playing the first track
          {
            autoplay: 0 // Prevent autoplay on initial load
          }
        );

        // Subscribe to the player's internal ready and state change events
        // to update the playlist service's state.
        if (this.player) {
            // outputs.ready.subscribe() would be for actions when the player instance is ready.
            // outputs.change.subscribe() is for state changes.
            // However, the createPlayer function already sets up onReady and onStateChange.
            // We need to re-wire them here if we want the PlaylistService to directly react.

            // The `createPlayer` method in `YoutubePlayerService` already takes `outputs`
            // which are ReplaySubjects. We just need to subscribe to those ReplaySubjects
            // in the PlaylistService.

            // Let's get the ReplaySubjects from the `createPlayer` call's outputs.
            // A more robust way might be for createPlayer to return an object
            // containing both the player and these subjects, or for the service
            // to store them. For now, let's assume `createPlayer` passes events
            // correctly.
            // The provided `YoutubePlayerService` passes these to the `outputs` parameter.
            // So we need to subscribe to those subjects here:

            // A slightly cleaner way to get the event handling from createPlayer:
            const playerOutputs: IPlayerOutputs = {
              ready: createReplaySubject<YT.Player>(1),
              change: createReplaySubject<YT.PlayerEvent>(1),
            };

            this.player = this.youtubePlayerService.createPlayer(
              'youtube-player',
              playerOutputs, // Pass these subjects to createPlayer
              { height: 270, width: 367 },
              '',
              { autoplay: 0 }
            );

            // Now subscribe to these subjects directly in the PlaylistService
            playerOutputs.change.subscribe((event: any) => {
                this.zone.run(() => {
                    switch (event.data) {
                        case YT.PlayerState.PLAYING:
                            this._playbackState.next('playing');
                            break;
                        case YT.PlayerState.PAUSED:
                            this._playbackState.next('paused');
                            break;
                        case YT.PlayerState.ENDED:
                            this.handleTrackEnd();
                            break;
                        case YT.PlayerState.BUFFERING:
                            // Optionally handle buffering state
                            break;
                        default:
                            break;
                    }
                });
            });

            playerOutputs.ready.subscribe((playerInstance: YT.Player) => {
                // Player is ready, perform any initial actions if needed
                console.log('YouTube Player is ready:', playerInstance);
            });

        }
      }
    });
  }

  setPlaylist(newPlaylist: any[]): void {
    this.originalPlaylist = [...newPlaylist];
    this._playlist.next(newPlaylist);
    if (newPlaylist.length > 0) {
      this.setCurrentTrackIndex(0); // Select the first track by default
    } else {
      this.setCurrentTrackIndex(-1);
    }
    this.stop(); // Stop playback when playlist changes
  }

  setCurrentTrackIndex(index: number): void {
    if (index >= 0 && index < this._playlist.getValue().length) {
      this._currentTrackIndex.next(index);
      const currentTrack = this._playlist.getValue()[index];
      if (this.player && currentTrack) { // Ensure currentTrack exists before playing
        this.youtubePlayerService.playVideo(currentTrack, this.player);
        this._playbackState.next('playing'); // Assume playing after selecting new track
      }
    } else {
      this._currentTrackIndex.next(-1);
      this.stop();
    }
  }

  play(): void {
    if (this.player && this._currentTrackIndex.getValue() !== -1) {
      this.player.playVideo();
      this._playbackState.next('playing');
    } else if (this._playlist.getValue().length > 0) {
      // If no track is selected, play the first one
      this.setCurrentTrackIndex(0); // This will call playVideo and set state to 'playing'
    }
  }

  pause(): void {
    if (this.player) {
      this.player.pauseVideo();
      this._playbackState.next('paused');
    }
  }

  stop(): void {
    if (this.player) {
      this.player.stopVideo();
      this._playbackState.next('stopped');
    }
  }

  next(): void {
    const currentPlaylist = this._playlist.getValue();
    if (currentPlaylist.length === 0) return;

    let nextIndex = this._currentTrackIndex.getValue();
    const repeatMode = this._repeatMode.getValue();

    if (repeatMode === 'one') {
      this.play(); // Replay the current track
      return;
    }

    if (this._isShuffled.getValue()) {
      nextIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
      nextIndex++;
      if (nextIndex >= currentPlaylist.length) {
        if (repeatMode === 'all') {
          nextIndex = 0; // Loop back to the beginning
        } else {
          this.stop(); // Stop if no repeat and at end of playlist
          return;
        }
      }
    }
    this.setCurrentTrackIndex(nextIndex);
  }

  previous(): void {
    const currentPlaylist = this._playlist.getValue();
    if (currentPlaylist.length === 0) return;

    let previousIndex = this._currentTrackIndex.getValue() - 1;
    if (previousIndex < 0) {
      // If at the beginning, go to the end if repeat all is active
      if (this._repeatMode.getValue() === 'all') {
        previousIndex = currentPlaylist.length - 1;
      } else {
        return; // Do nothing if at the beginning and not repeating
      }
    }
    this.setCurrentTrackIndex(previousIndex);
  }

  toggleShuffle(): void {
    const currentState = this._isShuffled.getValue();
    this._isShuffled.next(!currentState);
    this.applyShuffleState(!currentState);
  }

  private applyShuffleState(shuffle: boolean): void {
    if (shuffle) {
      const shuffledPlaylist = this.shuffleArray([...this.originalPlaylist]);
      this._playlist.next(shuffledPlaylist);
      const currentTrack = this._playlist.getValue()[this._currentTrackIndex.getValue()];
      if (currentTrack) {
        const newIndex = shuffledPlaylist.findIndex(track => track.id?.videoId === currentTrack.id?.videoId);
        if (newIndex !== -1) {
          this._currentTrackIndex.next(newIndex);
        } else {
          this._currentTrackIndex.next(0);
        }
      } else if (shuffledPlaylist.length > 0) {
        this._currentTrackIndex.next(0);
      }
    } else {
      this._playlist.next([...this.originalPlaylist]);
      const currentTrack = this._playlist.getValue()[this._currentTrackIndex.getValue()];
      if (currentTrack) {
        const newIndex = this.originalPlaylist.findIndex(track => track.id?.videoId === currentTrack.id?.videoId);
        if (newIndex !== -1) {
          this._currentTrackIndex.next(newIndex);
        } else {
          this._currentTrackIndex.next(0);
        }
      } else if (this.originalPlaylist.length > 0) {
        this._currentTrackIndex.next(0);
      }
    }
  }

  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  toggleRepeat(): void {
    const currentMode = this._repeatMode.getValue();
    let nextMode: 'none' | 'all' | 'one' = 'none';
    if (currentMode === 'none') {
      nextMode = 'all';
    } else if (currentMode === 'all') {
      nextMode = 'one';
    } else {
      nextMode = 'none';
    }
    this._repeatMode.next(nextMode);
  }

  private handleTrackEnd(): void {
    const repeatMode = this._repeatMode.getValue();
    const currentIndex = this._currentTrackIndex.getValue();
    const playlistLength = this._playlist.getValue().length;

    if (repeatMode === 'one') {
      this.play();
    } else if (repeatMode === 'all' || currentIndex < playlistLength - 1) {
      this.next();
    } else {
      this.stop();
    }
  }

  updatePlaylistOrder(newOrderedPlaylist: any[]): void {
    this._playlist.next(newOrderedPlaylist);
    this.originalPlaylist = [...newOrderedPlaylist];
  }
}
