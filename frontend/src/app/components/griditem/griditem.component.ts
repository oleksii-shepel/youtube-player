import { Component, Input, Output, EventEmitter } from '@angular/core';
import { YoutubeVideoComponent } from '../video/video.component';
import { YoutubePlaylistComponent } from '../playlist/playlist.component';
import { YoutubeChannelComponent } from '../channel/channel.component';
import { AdsenseComponent } from '../adsense/adsense.component';
import { environment } from 'src/environments/environment';
import { AdvertisementComponent } from '../advertisement/advertisement.component';

@Component({
  selector: 'app-grid-item',
  standalone: true,
  imports: [
    YoutubeVideoComponent,
    YoutubePlaylistComponent,
    YoutubeChannelComponent,
    AdvertisementComponent
  ],
  template: `
  @if (type !== undefined) {
    @if (type === 'video') {
    <app-youtube-video
        [attr.data-type]="type"
        [videoData]="data"
        [isCompact]="false"
        [displayDescription]="displayDescription"
        (addTrackToPlaylist)="addTrackToPlaylist.emit($event)"
    />
    }

    @if (type === 'playlist') {
    <app-youtube-playlist
        [attr.data-type]="type"
        [playlistData]="data"
        [displayDescription]="displayDescription"
    />
    }

    @if (type === 'channel') {
    <app-youtube-channel
        [attr.data-type]="type"
        [channelData]="data"
        [displayDescription]="displayDescription"
    />
    }

    @if (type === 'advertisement') {
    <app-advertisement
        mode="random"
        [attr.data-type]="type"
    />
    }
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
