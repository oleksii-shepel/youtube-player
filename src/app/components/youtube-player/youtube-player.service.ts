// YoutubePlayerService - (No major changes needed, but ensure outputs are ReplaySubjects)
import { Injectable, NgZone } from "@angular/core";
import { createReplaySubject, ReplaySubject } from "@actioncrew/streamix";

export interface IPlayerSize {
  height: number;
  width: number;
}

export interface IPlayerOutputs {
  ready: ReplaySubject<YT.Player>;
  change: ReplaySubject<YT.PlayerEvent>;
}

export interface IPlayerApiScriptOptions {
  protocol: 'http' | 'https';
}


export function win() {
  return window as any;
}

export function YouTubeRef(): any {
  return win()["YT"] as any;
}

export function YouTubePlayerRef() {
  return YouTubeRef().Player as any;
}

export const defaultSizes = {
  height: 270,
  width: 367,
};

@Injectable({
  providedIn: "root",
})
export class YoutubePlayerService {
  api: ReplaySubject<YT.Player>; // This subject emits the YT.Player constructor

  static ytApiLoaded = false;

  constructor(private zone: NgZone) {
    this.api = createReplaySubject(1);
    this.createApi();
  }

  loadPlayerApi(options: IPlayerApiScriptOptions) {
    const doc = win().document;
    if (!YoutubePlayerService["ytApiLoaded"]) {
      YoutubePlayerService.ytApiLoaded = true;
      const playerApiScript = doc.createElement("script");
      playerApiScript.type = "text/javascript";
      playerApiScript.src = `${options.protocol}://www.youtube.com/iframe_api`; // Correct YouTube API URL
      doc.body.appendChild(playerApiScript);
    }
  }

  generateUniqueId(): string {
    const len = 7;
    return Math.random().toString(35).substr(2, len);
  }

  // This method should return the created player instance
  createPlayer(
    elementId: string,
    outputs: IPlayerOutputs,
    sizes: IPlayerSize,
    videoId = "",
    playerVars: YT.PlayerVars = {}
  ): YT.Player { // Explicitly return YT.Player
    const playerSize = {
      height: sizes.height || defaultSizes.height,
      width: sizes.width || defaultSizes.width,
    };
    const ytPlayer = YouTubePlayerRef();
    const player = new ytPlayer(elementId, {
      ...playerSize,
      events: {
        onReady: (ev: YT.PlayerEvent) => {
          this.zone.run(() => outputs.ready && outputs.ready.next(ev.target));
          if(videoId && playerVars.autoplay !== 0) { // Check autoplay playerVar
            ev.target.playVideo();
          }
        },
        onStateChange: (ev: YT.PlayerEvent) => {
          this.zone.run(() => outputs.change && outputs.change.next(ev));
        },
      },
      playerVars,
      videoId,
    });
    return player;
  }

  playVideo(media: any, player: YT.Player) {
    const id = media.id.videoId ? media.id.videoId : media.id;
    player.loadVideoById(id);
  }

  stopVideo(player: YT.Player) {
    player.stopVideo();
  }

  play(player: YT.Player) {
    player.playVideo();
  }

  pause(player: YT.Player) {
    player.pauseVideo();
  }

  // ... other methods as they are
  private createApi() {
    const onYouTubeIframeAPIReady = () => {
      if (win()) {
        win()["onYouTubeIframeAPIReadyCalled"] = true;
        this.api.next(YouTubeRef()); // Emit the YouTube API object, not PlayerRef directly
      }
    };
    win()["onYouTubeIframeAPIReady"] = onYouTubeIframeAPIReady;
    if (win()["onYouTubeIframeAPIReadyCalled"]) {
      this.api.next(YouTubeRef());
    }
  }
}

