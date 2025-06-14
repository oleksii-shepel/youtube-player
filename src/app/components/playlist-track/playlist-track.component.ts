import { ToFriendlyDurationPipe } from './../../pipes/to-friendly-duration.pipe';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
  selector: 'app-playlist-track',
  template: `
    <ion-item (click)="selectTrack()" class="track">
        <ion-thumbnail slot="start">
        <img [src]="thumbnailUrl" alt="Thumbnail">
      </ion-thumbnail>
      <ion-label>
        <h2>{{ track.snippet.title }}</h2>
        <p>{{ formattedDuration | toFriendlyDuration }}</p>
      </ion-label>
    </ion-item>
  `,
  styleUrls: ['./playlist-track.component.scss'],
  standalone: false,
})
export class PlaylistTrackComponent {
  @Input() track!: any; // This represents the track passed as input
  @Input() thumbnailUrl!: string; // Now directly receiving the thumbnail URL
  @Input() formattedDuration!: string; // Now directly receiving the formatted duration
  @Output() trackSelected = new EventEmitter<any>();
  @Input() isSelected: boolean = false;

  @HostBinding('class.selected') get addSelectedClass() {
    return this.isSelected;
  }

  selectTrack(): void {
    this.trackSelected.emit(this.track);  // Emit the selected track to the parent component
  }
}
