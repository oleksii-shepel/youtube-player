// YoutubePlayerService: Manages the YouTube Iframe Player API loading and player instances.

import { Injectable, NgZone } from "@angular/core";
// Ensure createReplaySubject and ReplaySubject are imported from @actioncrew/streamix
import { createReplaySubject, ReplaySubject } from "@actioncrew/streamix";

/**
 * Interface for specifying the size of the YouTube player.
 */
export interface IPlayerSize {
  height: number;
  width: number;
}

/**
 * Interface for player event output subjects. These subjects emit events
 * from the YouTube player's onReady and onStateChange events.
 */
export interface IPlayerOutputs {
  ready: ReplaySubject<YT.Player>; // Emits the YT.Player instance when ready
  change: ReplaySubject<YT.PlayerEvent>; // Emits YT.PlayerEvent on state changes
}

/**
 * Interface for options when loading the YouTube Iframe API script.
 */
export interface IPlayerApiScriptOptions {
  protocol: 'http' | 'https'; // Protocol for loading the script (http or https)
}

// === Utility Functions for accessing global YouTube API objects ===

/**
 * Safely accesses the global window object.
 */
export function win(): any {
  return window as any;
}

/**
 * Safely accesses the global YouTube API (YT) object.
 */
export function YouTubeRef(): any {
  return win()["YT"] as any;
}

/**
 * Safely accesses the YouTube Player constructor (YT.Player).
 */
export function YouTubePlayerRef(): any {
  return YouTubeRef().Player as any;
}

/**
 * Default sizes for the YouTube player if not specified.
 */
export const defaultSizes = {
  height: 270,
  width: 367,
};

@Injectable({
  providedIn: "root", // Ensures the service is a singleton and available throughout the app
})
export class YoutubePlayerService {
  /**
   * Subject that emits the global YouTube API (YT) object once it's loaded and ready.
   * This is used to signal that `YT.Player` can now be instantiated.
   */
  // **REFINEMENT:** Corrected type: `api` emits the global `YT` namespace, not a `YT.Player` instance.
  api: ReplaySubject<any>; // Changed from YT.Player to any (representing typeof YT)

  /**
   * Static flag to ensure the YouTube Iframe API script is loaded only once.
   */
  static ytApiLoaded = false;

  constructor(private zone: NgZone) {
    this.api = createReplaySubject(1); // Initialize ReplaySubject from streamix
    this.createApi(); // Start the process of loading the YouTube API
  }

  /**
   * Loads the YouTube Iframe Player API script into the document body.
   * Ensures the script is only added once.
   * @param options Options for loading the API script, e.g., protocol.
   */
  loadPlayerApi(options: IPlayerApiScriptOptions) {
    const doc = win().document;
    if (!YoutubePlayerService.ytApiLoaded) {
      YoutubePlayerService.ytApiLoaded = true;
      const playerApiScript = doc.createElement("script");
      playerApiScript.type = "text/javascript";
      playerApiScript.src = `${options.protocol}://www.youtube.com/iframe_api`; // Standard YouTube API URL
      doc.body.appendChild(playerApiScript);
    }
  }

  /**
   * Generates a simple unique ID for a DOM element.
   * Used for assigning an ID to the player container div.
   * @returns A unique string ID.
   */
  generateUniqueId(): string {
    const len = 7;
    return Math.random().toString(35).substring(2, len);
  }

  /**
   * Creates a new YouTube Iframe Player instance.
   * This method should be called once the YouTube API is loaded (after `api` subject emits).
   * @param elementId The DOM element ID where the player will be embedded.
   * @param outputs An object containing ReplaySubjects for player events (ready, change).
   * @param sizes The desired width and height of the player.
   * @param videoId The ID of the video to load initially (optional).
   * @param playerVars Player parameters to customize the player (optional).
   * @returns The created YT.Player instance.
   */
  createPlayer(
    elementId: string,
    outputs: IPlayerOutputs, // IPlayerOutputs uses ReplaySubject from streamix
    sizes: IPlayerSize,
    videoId = "",
    playerVars: YT.PlayerVars = {}
  ): YT.Player { // Explicitly return YT.Player
    const playerSize = {
      // Use default sizes if not provided
      height: sizes.height || defaultSizes.height,
      width: sizes.width || defaultSizes.width,
    };
    const ytPlayerConstructor = YouTubePlayerRef(); // Get the YT.Player constructor
    const player = new ytPlayerConstructor(elementId, {
      ...playerSize,
      events: {
        // Handle onReady event: emit player instance and potentially play video
        onReady: (ev: YT.PlayerEvent) => {
          this.zone.run(() => outputs.ready?.next(ev.target)); // Emit player instance in Angular zone
          // If videoId is provided and autoplay is not explicitly set to 0, play on ready.
          // Note: Autoplay can be tricky on mobile devices due to browser policies.
          if(videoId && playerVars.autoplay !== 0) {
            ev.target.playVideo();
          }
        },
        // Handle onStateChange event: emit the event object
        onStateChange: (ev: YT.PlayerEvent) => {
          this.zone.run(() => outputs.change?.next(ev)); // Emit state change event in Angular zone
        },
      },
      playerVars, // Apply custom player parameters
      videoId, // Load the initial video
    });
    return player;
  }

  /**
   * Loads a specific video by ID into the player and plays it.
   * @param media An object containing the video ID (e.g., { id: { videoId: '...' } } or just 'videoId').
   * @param player The YT.Player instance to control.
   */
  playVideo(media: any, player: YT.Player) {
    const id = media.id?.videoId ? media.id.videoId : media.id;
    const currentVideoId = player.getVideoData()?.video_id;
    if (currentVideoId === id) {
      // Same video loaded: just resume playback without resetting position
      player.playVideo();
    } else {
      // Different video: load it from start
      player.loadVideoById(id);
    }
  }

  /**
   * Stops the currently playing video in the given player.
   * @param player The YT.Player instance to control.
   */
  stopVideo(player: YT.Player) {
    player.stopVideo();
  }

  /**
   * Plays the currently loaded video in the given player.
   * @param player The YT.Player instance to control.
   */
  play(player: YT.Player) {
    player.playVideo();
  }

  /**
   * Pauses the currently playing video in the given player.
   * @param player The YT.Player instance to control.
   */
  pause(player: YT.Player) {
    player.pauseVideo();
  }

  /**
   * Internal method to set up the global `onYouTubeIframeAPIReady` callback.
   * This function is called by the YouTube Iframe API script once it has loaded.
   */
  private createApi() {
    const onYouTubeIframeAPIReady = () => {
      if (win()) {
        // Set a flag on window to indicate the API's ready callback has been invoked.
        // This helps handle cases where the script might load before `onYouTubeIframeAPIReady` is assigned.
        win()["onYouTubeIframeAPIReadyCalled"] = true;
        // Emit the global YT object through the `api` subject,
        // signaling that the YouTube API is fully loaded and ready for use.
        this.api.next(YouTubeRef());
      }
    };
    // Assign the callback to the global window object.
    win()["onYouTubeIframeAPIReady"] = onYouTubeIframeAPIReady;

    // If the API has already been loaded and its ready callback was already invoked
    // (e.g., due to hot module replacement or quick page loads),
    // immediately emit the API object.
    if (win()["onYouTubeIframeAPIReadyCalled"]) {
      this.api.next(YouTubeRef());
    }
  }
}
