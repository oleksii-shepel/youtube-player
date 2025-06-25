import { ToFriendlyDurationPipe } from './../../pipes/to-friendly-duration.pipe';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';

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
          <img
            [src]="thumbnailUrl"
            [alt]="track.snippet?.title || 'Track thumbnail'"
          />
          <div
            class="playing-overlay"
            [style.visibility]="isPlaying ? 'visible' : 'hidden'"
            aria-hidden="true"
          >
            <svg viewBox="0 0 50 50" width="50" height="50" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <!-- Gradient for the main button -->
                <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#bb5a5a;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#a14a4a;stop-opacity:1" />
                </linearGradient>

                <!-- Gradient for the glow effect -->
                <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" style="stop-color:#bb5a5a;stop-opacity:0.4" />
                  <stop offset="70%" style="stop-color:#a14a4a;stop-opacity:0.2" />
                  <stop offset="100%" style="stop-color:#a14a4a;stop-opacity:0" />
                </radialGradient>

                <!-- Drop shadow filter -->
                <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
                </filter>

                <!-- Blur filter for glow -->
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <!-- Animated background ring -->
              <circle cx="25" cy="25" r="20" fill="none" stroke="#a14a4a" stroke-width="0.5" opacity="0.3">
                <animate attributeName="r" values="20;22;20" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
              </circle>

              <!-- Main button circle with glow -->
              <circle cx="25" cy="25" r="18" fill="url(#glowGradient)" filter="url(#glow)">
                <animate attributeName="r" values="18;19;18" dur="2s" repeatCount="indefinite" />
              </circle>

              <!-- Main button -->
              <circle cx="25" cy="25" r="16" fill="url(#playGradient)" filter="url(#dropShadow)">
                <animate attributeName="r" values="16;17;16" dur="2s" repeatCount="indefinite" />
              </circle>

              <!-- Play button triangle -->
              <polygon points="21,19 21,31 32,25" fill="#d8d8d8" opacity="0.9" />

              <!-- Subtle rotating highlight -->
              <circle cx="25" cy="25" r="16" fill="none" stroke="url(#glowGradient)" stroke-width="1" opacity="0.4">
                <animateTransform attributeName="transform"
                                  attributeType="XML"
                                  type="rotate"
                                  values="0 25 25;360 25 25"
                                  dur="6s"
                                  repeatCount="indefinite"/>
              </circle>

              <!-- Central highlight dot -->
              <circle cx="23" cy="21" r="1" fill="#ffffffc4" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </ion-thumbnail>
        <ion-label>
          <h2 class="track-title">
            {{ track.snippet?.title || 'Unknown Title' }}
          </h2>
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
  standalone: false,
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
