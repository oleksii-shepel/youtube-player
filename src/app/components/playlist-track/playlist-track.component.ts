import { ToFriendlyDurationPipe } from './../../pipes/to-friendly-duration.pipe';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-playlist-track',
  template: `
    <ion-item (click)="selectTrack()">
      <ion-thumbnail slot="start">
        <img [src]="getThumbnail()" alt="Thumbnail">
      </ion-thumbnail>
      <ion-label>
        <h2>{{ track.snippet.title }}</h2>
        <p>{{ getFormattedDuration() | toFriendlyDuration }}</p>
      </ion-label>
    </ion-item>
  `,
  styleUrls: ['./playlist-track.component.scss'],
  standalone: false,
})
export class PlaylistTrackComponent {
  @Input() track!: any; // This represents the track passed as input
  @Output() trackSelected = new EventEmitter<any>();

  // Get the thumbnail URL from the track object
  getThumbnail(): string {
    const thumbnail = this.track.snippet?.thumbnails?.high?.url || this.track.snippet?.thumbnails?.medium?.url || this.track.snippet?.thumbnails?.default?.url;
    return thumbnail || ''; // Return the best available thumbnail
  }

  // Format duration (assuming it's in ISO 8601 format)
  getFormattedDuration(): string {
    return this.track.contentDetails?.duration;
  }

  selectTrack(): void {
    this.trackSelected.emit(this.track);  // Emit the selected track to the parent component
  }
}
