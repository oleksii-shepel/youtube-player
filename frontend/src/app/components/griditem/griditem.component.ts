import { Component, Input, Output, EventEmitter } from '@angular/core';
import { YoutubeVideoComponent } from '../video/video.component';
import { YoutubePlaylistComponent } from '../playlist/playlist.component';
import { YoutubeChannelComponent } from '../channel/channel.component';
import { AdsenseComponent } from '../adsense/adsense.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-grid-item',
  standalone: true,
  imports: [
    YoutubeVideoComponent,
    YoutubePlaylistComponent,
    YoutubeChannelComponent,
    AdsenseComponent
  ],
  template: `
    @if (type === 'video') {
    <app-youtube-video
        [videoData]="data"
        [isCompact]="false"
        [displayDescription]="displayDescription"
        (addTrackToPlaylist)="addTrackToPlaylist.emit($event)"
    />
    }

    @if (type === 'playlist') {
    <app-youtube-playlist
        [playlistData]="data"
        [displayDescription]="displayDescription"
    />
    }

    @if (type === 'channel') {
    <app-youtube-channel
        [channelData]="data"
        [displayDescription]="displayDescription"
    />
    }

    @if (type === 'advertisement') {
    <app-adsense
        [slot]="data"
        [client]="environment.adSense.clientId"
    />
    }
  `,
})
export class GridItemComponent {
  @Input() type!: 'video' | 'playlist' | 'channel' | 'advertisement';
  @Input() data: any;
  @Input() displayDescription = false;

  environment = environment;

  /** optional for videos */
  @Output() addTrackToPlaylist = new EventEmitter<any>();
}
