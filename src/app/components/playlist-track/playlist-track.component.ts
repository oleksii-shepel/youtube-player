import { ToFriendlyDurationPipe } from './../../pipes/to-friendly-duration.pipe';
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
  Renderer2,
  HostBinding
} from '@angular/core';
import { IonItemSliding, Gesture, GestureController } from '@ionic/angular';

@Component({
  selector: 'app-playlist-track',
  template: `
    <ion-item-sliding #slidingItem>
      <ion-item
        (click)="onItemClick()"
        class="track"
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
            </div>
        </ion-thumbnail>
        <ion-label>
          <h2 class="track-title">
            {{ (track.snippet?.title || 'Unknown Title') | slice:0:70 }}{{ (track.snippet?.title?.length || 0) > 70 ? '…' : '' }}
          </h2>
          <p class="duration">{{ formattedDuration | toFriendlyDuration }}</p>
        </ion-label>
      </ion-item>
    </ion-item-sliding>
  `,
  styleUrls: ['./playlist-track.component.scss'],
  standalone: false,
})
export class PlaylistTrackComponent implements AfterViewInit, OnDestroy {
  @ViewChild(IonItemSliding, { read: ElementRef }) private slidingItemEl!: ElementRef;
  @ViewChild(IonItemSliding) private ionSlidingItem!: IonItemSliding;

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

  private customSwipeGesture?: Gesture;
  // Thresholds for deletion (still relevant for background change/deletion trigger)
  private readonly SWIPE_DELETE_THRESHOLD_PX = 100;
  private readonly SWIPE_VELOCITY_THRESHOLD = 0.5;

  private isGestureActive = false;
  private isDeleting = false;

  constructor(
    private gestureCtrl: GestureController,
    private zone: NgZone,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    if (this.slidingItemEl && this.slidingItemEl.nativeElement) {
      this.setupSwipeToDeleteGesture();
    }
  }

  ngOnDestroy(): void {
    if (this.customSwipeGesture) {
      this.customSwipeGesture.destroy();
    }
  }

  private setupSwipeToDeleteGesture(): void {
    const itemSlidingNativeEl = this.slidingItemEl.nativeElement;
    const ionItemContent = itemSlidingNativeEl.querySelector('ion-item') as HTMLElement;

    if (!ionItemContent) {
      console.warn('Could not find ion-item content for gesture setup.');
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.customSwipeGesture = this.gestureCtrl.create({
        el: ionItemContent,
        threshold: 5,
        gestureName: 'one-swipe-delete',
        direction: 'x',
        onStart: (ev) => {
          if (this.isDeleting) return;

          const target = ev.event.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            this.isGestureActive = false;
            return;
          }

          this.isGestureActive = true;
          this.isDeleting = false;

          this.zone.run(async () => {
             await this.ionSlidingItem.close();
          });

          // Disable transitions for background color change to be immediate if desired
          this.renderer.setStyle(ionItemContent, 'transition', 'background-color 0.2s ease'); // Only transition background
          this.renderer.setStyle(itemSlidingNativeEl, 'overflow', 'hidden'); // Keep overflow hidden during gesture
          this.renderer.setStyle(ionItemContent, 'backgroundColor', 'var(--ion-item-background)');
          this.renderer.setStyle(ionItemContent, 'opacity', '1');
          this.renderer.setStyle(ionItemContent, 'transform', 'translateX(0px)'); // **Crucial: Always keep at 0px**
        },
        onMove: (ev) => {
          if (!this.isGestureActive || this.isDeleting) return;

          const deltaX = ev.deltaX;
          const velocityX = ev.velocityX;

          // **DO NOT APPLY TRANSFORM TO ionItemContent HERE**
          // ionItemContent.style.transform = `translateX(${Math.max(deltaX, -ionItemContent.offsetWidth)}px)`;

          if (deltaX < 0) { // Swiping left
            if (Math.abs(deltaX) >= this.SWIPE_DELETE_THRESHOLD_PX || Math.abs(velocityX) >= this.SWIPE_VELOCITY_THRESHOLD) {
              this.zone.run(() => {
                this.renderer.setStyle(ionItemContent, 'backgroundColor', 'var(--ion-color-danger)');
              });
            } else {
              this.zone.run(() => {
                this.renderer.setStyle(ionItemContent, 'backgroundColor', 'var(--ion-item-background)');
              });
            }
          } else { // Swiping right or minimal movement
            this.renderer.setStyle(ionItemContent, 'backgroundColor', 'var(--ion-item-background)');
          }
        },
        onEnd: (ev) => {
          if (!this.isGestureActive || this.isDeleting) return;
          this.isGestureActive = false;

          // Re-enable original transition or set new one for background fade
          this.renderer.setStyle(ionItemContent, 'transition', 'background-color 0.2s ease, opacity 0.3s ease-out');
          this.renderer.setStyle(itemSlidingNativeEl, 'overflow', 'visible');

          const finalDeltaX = ev.deltaX;
          const finalVelocityX = ev.velocityX;

          if (Math.abs(finalDeltaX) >= this.SWIPE_DELETE_THRESHOLD_PX || Math.abs(finalVelocityX) >= this.SWIPE_VELOCITY_THRESHOLD) {
            this.isDeleting = true;

            this.zone.run(() => {
              // Only fade out the item, don't move it
              this.renderer.setStyle(ionItemContent, 'opacity', '0');
              // Ensure background stays danger color during fade-out
              this.renderer.setStyle(ionItemContent, 'backgroundColor', 'var(--ion-color-danger-tint, #ff9999)');
            });

            // Wait for the fade-out animation to complete
            setTimeout(() => {
              this.zone.run(() => {
                this.trackDeleted.emit(this.track);
                // Optional: reset background and opacity immediately after emitting to prepare for reuse
                this.renderer.setStyle(ionItemContent, 'backgroundColor', 'var(--ion-item-background)');
                this.renderer.setStyle(ionItemContent, 'opacity', '1');
              });
            }, 300); // Match CSS transition duration
          } else {
            // Not deleted, animate background back to original
            this.zone.run(() => {
              this.renderer.setStyle(ionItemContent, 'backgroundColor', 'var(--ion-item-background)');
              this.renderer.setStyle(ionItemContent, 'opacity', '1');
              this.renderer.setStyle(ionItemContent, 'transform', `translateX(0px)`); // Explicitly ensure no transform
            });
          }
        }
      });
      this.customSwipeGesture.enable(true);
    });
  }

  async onItemClick(): Promise<void> {
    if (this.isGestureActive || this.isDeleting) {
      console.log('Click ignored: Gesture was active or item is deleting.');
      return;
    }

    const openAmount = await this.ionSlidingItem.getSlidingRatio();
    if (openAmount > 0) {
      await this.ionSlidingItem.close();
      console.log('Click consumed: Closed sliding item options.');
      return;
    }

    this.trackSelected.emit(this.track);
  }
}
