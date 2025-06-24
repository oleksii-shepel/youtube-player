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
       <ion-thumbnail slot="start" class="thumbnail-container">
          <img [src]="thumbnailUrl" [alt]="track.snippet?.title || 'Track thumbnail'" />
          <div class="playing-overlay" *ngIf="isPlaying" aria-hidden="true">
            <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="20" fill="#a14a4a" opacity="0.8">
                <animate attributeName="r"
                        values="15;25;15"
                        dur="2s"
                        repeatCount="indefinite"/>
                <animate attributeName="opacity"
                        values="0.8;0.3;0.8"
                        dur="2s"
                        repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
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
  @Input() isPlaying: boolean = false;


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
