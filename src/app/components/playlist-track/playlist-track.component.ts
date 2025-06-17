import { ToFriendlyDurationPipe } from './../../pipes/to-friendly-duration.pipe';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
  selector: 'app-playlist-track',
  template: `
    <ion-item-sliding>
      <ion-item
        (click)="selectTrack()"
        class="track"
        [class.selected]="isSelected"
        [attr.aria-selected]="isSelected"
        role="option"
      >
        <ion-thumbnail slot="start">
          <img [src]="thumbnailUrl" [alt]="track.snippet?.title || 'Track thumbnail'" />
        </ion-thumbnail>
        <ion-label>
          <h2 class="track-title">{{ track.snippet?.title || 'Unknown Title' }}</h2>
          <p class="duration">{{ formattedDuration | toFriendlyDuration }}</p>
        </ion-label>
      </ion-item>

      <ion-item-options side="end">
        <ion-item-option color="danger" (click)="deleteTrack()" expandable>
          Delete
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  `,
  styleUrls: ['./playlist-track.component.scss'],
  standalone: false
})
export class PlaylistTrackComponent {
  @Input() track!: any;
  @Input() thumbnailUrl!: string;
  @Input() formattedDuration!: string;
  @Input() isSelected: boolean = false;

  @Output() trackSelected = new EventEmitter<any>();
  @Output() trackDeleted = new EventEmitter<any>();

  @HostBinding('class.selected')
  get addSelectedClass() {
    return this.isSelected;
  }

  selectTrack(): void {
    this.trackSelected.emit(this.track);
  }

  deleteTrack(): void {
    this.trackDeleted.emit(this.track);
  }
}
