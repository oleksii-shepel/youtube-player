import { CommonModule } from '@angular/common';
import { ToFriendlyDurationPipe } from '../../pipes/to-friendly-duration.pipe';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  HostBinding
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DirectiveModule } from 'src/app/directives';

@Component({
  selector: 'app-playlist-track',
  template: `
    <div
      #slidingItem
      appSwipeable
      [halfSwipeThreshold]="80"
      [deleteThreshold]="120"
      [enableHapticFeedback]="true"
      (halfSwipe)="onHalfSwipe()"
      (delete)="onDelete()"
      (swipeStart)="onSwipeStart()"
      (swipeEnd)="onSwipeEnd()"
    >
      <ion-item
        (click)="onItemClick()"
        class="track sliding-content"
        [class.selected]="isSelected"
        [attr.aria-selected]="isSelected"
      >
        <div class="drag-handle" slot="start">
          <ion-icon name="reorder-three-outline"></ion-icon>
        </div>

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
            <svg viewBox="0 0 50 50" width="3.125em" height="3.125em" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <!-- Gradient for the main button -->
                <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="currentColor" stop-opacity="1" />
                  <stop offset="100%" stop-color="currentColor" stop-opacity="0.8" />
                </linearGradient>

                <!-- Gradient for the glow effect -->
                <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="currentColor" stop-opacity="0.4" />
                  <stop offset="70%" stop-color="currentColor" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
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
              <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3">
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
            {{ (track.snippet?.title || 'Unknown Title') | slice:0:70 }}{{ (track.snippet?.title?.length || 0) > 70 ? '…' : '' }}
          </h2>
          <p class="duration">{{ formattedDuration | toFriendlyDuration }}</p>
        </ion-label>
      </ion-item>
    </div>
  `,
  styleUrls: ['./track.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, DirectiveModule, ToFriendlyDurationPipe]
})
export class TrackComponent implements AfterViewInit, OnDestroy {
  @ViewChild('slidingItem', { read: ElementRef }) private slidingItemEl!: ElementRef;

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

  private isGestureActive = false;
  private isDeleting = false;

  constructor(
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    // No need to setup custom gesture - directive handles it
  }

  ngOnDestroy(): void {
    // No cleanup needed - directive handles it
  }

  // Directive event handlers
  onHalfSwipe(): void {
    console.log('Half swipe detected - could show preview or options');
    // Optional: Show additional UI feedback for half swipe
  }

  onDelete(): void {
    if (this.isDeleting) return;

    this.isDeleting = true;
    this.zone.run(() => {
      this.trackDeleted.emit(this.track);
    });
  }

  onSwipeStart(): void {
    this.isGestureActive = true;
    console.log('Swipe started');
  }

  onSwipeEnd(): void {
    this.isGestureActive = false;
    console.log('Swipe ended');
  }

  async onItemClick(): Promise<void> {
    if (this.isGestureActive || this.isDeleting) {
      console.log('Click ignored: Gesture was active or item is deleting.');
      return;
    }

    // Check if any swipe is active and close it
    const swipeableDirective = this.slidingItemEl?.nativeElement?.querySelector('[appSwipeable]');
    if (swipeableDirective && swipeableDirective.getSwipeState && swipeableDirective.getSwipeState() !== 'closed') {
      swipeableDirective.close();
      console.log('Click consumed: Closed swipe state.');
      return;
    }

    this.trackSelected.emit(this.track);
  }

  // Public method to close any open swipe state
  public closeSwipe(): void {
    const swipeableDirective = this.slidingItemEl?.nativeElement?.querySelector('[appSwipeable]');
    if (swipeableDirective && swipeableDirective.close) {
      swipeableDirective.close();
    }
  }
}
