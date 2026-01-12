import { filter, Subscription } from '@epikodelabs/streamix';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { AppearanceSettings } from 'src/app/interfaces/settings';
import { RecorderService } from 'src/app/services/recorder.service';
import { Settings } from 'src/app/services/settings.service';

enum RecorderState {
  InitializingCamera = 'InitializingCamera',
  CameraOff = 'CameraOff',
  CameraReady = 'CameraReady',
  Recording = 'Recording',
  RecordingComplete = 'RecordingComplete',
  CameraError = 'CameraError',
}

@Component({
  standalone: true,
  selector: 'app-recorder',
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!isHidden && appearanceSettings && appearanceSettings.visibleBackdrop) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)"></div>
    }

    <div class="modal-container" [class.hidden]="isHidden" [class.with-border]="showBorder" (click)="$event.stopPropagation()">
      <div class="video-container" [class.ready]="currentState !== RecorderState.CameraOff">
        <video #videoPreview autoplay muted playsinline></video>

        <!-- Status Indicator in Top-Right -->
        <div class="status-indicator-corner"
          [class.recording]="currentState === RecorderState.Recording"
          [class.ready]="currentState === RecorderState.CameraReady">
        </div>

        <!-- Temporary Status Message -->
        @if (showStatusMessage) {
          <div class="status-message">
            {{ getStatusText() }}
          </div>
        }

        @if (
          currentState === RecorderState.CameraError ||
          currentState === RecorderState.CameraOff
          ) {
          <div
            class="overlay"
            (click)="initializeCamera()"
            >
            @if (currentState === RecorderState.CameraError) {
              <ion-icon name="camera-off" size="large"></ion-icon>
            }
            @if (currentState === RecorderState.CameraOff) {
              <ion-icon
                name="camera"
                size="large"
              ></ion-icon>
            }
            <p>{{ getOverlayText() }}</p>
            @if (currentState === RecorderState.CameraError) {
              <ion-button
                (click)="initializeCamera()"
                fill="outline"
                color="primary"
                >
                Try Again
              </ion-button>
            }
          </div>
        }
      </div>

      <div class="controls">
        <!-- Camera Controls (CameraReady state) -->
        @if (currentState === RecorderState.CameraReady) {
          <div class="camera-controls">
            <ion-button
              (click)="startRecording()"
              fill="clear"
              color="primary"
              >
              <ion-icon name="radio-button-on" slot="start"></ion-icon>
              Start Recording
            </ion-button>
            <ion-button
              (click)="stopCamera()"
              fill="clear"
              color="primary"
              >
              <ion-icon name="camera-off" slot="start"></ion-icon>
              Turn Off Camera
            </ion-button>
          </div>
        }

        <!-- Recording Controls (Recording state) -->
        @if (currentState === RecorderState.Recording) {
          <ion-button
            (click)="stopRecording()"
            fill="clear"
            color="primary"
            >
            <ion-icon name="stop" slot="start"></ion-icon>
            Stop Recording
          </ion-button>
        }

        <!-- Playback Controls (RecordingComplete state) -->
        @if (currentState === RecorderState.RecordingComplete) {
          <div class="playback-controls">
            <ion-button
              (click)="playRecording()"
              fill="clear"
              color="primary"
              >
              <ion-icon name="play" slot="start"></ion-icon>
              Play
            </ion-button>
            <ion-button
              (click)="downloadRecording()"
              fill="clear"
              color="primary"
              >
              <ion-icon name="download" slot="start"></ion-icon>
              Download
            </ion-button>
            <ion-button
              (click)="recordAgain()"
              fill="clear"
              color="primary"
              >
              <ion-icon name="refresh" slot="start"></ion-icon>
              Record Again
            </ion-button>
          </div>
        }

        <!-- Turn On Camera Button (CameraOff state) -->
        @if (currentState === RecorderState.CameraOff) {
          <ion-button
            (click)="initializeCamera()"
            fill="clear"
            color="primary"
            >
            <ion-icon name="camera" slot="start"></ion-icon>
            Turn On Camera
          </ion-button>
        }

        <ion-button
          (click)="closeModal()"
          fill="solid"
          color="primary"
          class="close-btn"
          >
          <ion-icon name="close" slot="start"></ion-icon>
          Close
        </ion-button>
      </div>
    </div>
    `,
  styleUrls: ['recorder.component.scss'],
})
export class RecorderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isHidden = true;
  @Input() showBorder = true;

  @Output() close = new EventEmitter<void>();
  @ViewChild('videoPreview', { static: true }) videoPreview!: ElementRef<HTMLVideoElement>;

  currentState: RecorderState = RecorderState.CameraOff;
  cameraErrorMessage: string | null = null;
  showStatusMessage = false;
  private statusTimer: any;

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private videoUrl: string | null = null;
  private subs: Subscription[] = [];

  public appearanceSettings!: AppearanceSettings;

  readonly RecorderState = RecorderState;

  constructor(
    private recorderService: RecorderService,
    private cdRef: ChangeDetectorRef,
    private settings: Settings
  ) {}

  ngOnInit() {
    this.subs.push(
      this.settings.appearance.pipe(filter((value: any) => value)).subscribe(value => this.appearanceSettings = value)
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isHidden']) {
      const current = changes['isHidden'].currentValue;
      if (current) {
        this.closeModal();
      } else {
        this.initializeCamera();
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  private showTemporaryStatus() {
    this.showStatusMessage = true;
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      this.showStatusMessage = false;
      this.cdRef.markForCheck();
    }, 3000);
  }

  getOverlayText(): string {
    switch (this.currentState) {
      case RecorderState.CameraError:
        return this.cameraErrorMessage || 'Camera access denied or unavailable';
      case RecorderState.CameraOff:
        return 'Click to start camera';
      default:
        return '';
    }
  }

  getStatusText(): string {
    switch (this.currentState) {
      case RecorderState.Recording:
        return 'Recording...';
      case RecorderState.RecordingComplete:
        return 'Recording Complete';
      case RecorderState.CameraReady:
        return 'Camera Ready';
      case RecorderState.InitializingCamera:
        return 'Starting Camera...';
      case RecorderState.CameraError:
        return 'Camera Error';
      case RecorderState.CameraOff:
        return 'Camera Off';
      default:
        return 'Unknown State';
    }
  }

  async initializeCamera() {
    if (this.stream) {
      this.stopCameraStream();
    }

    this.currentState = RecorderState.InitializingCamera;
    this.cameraErrorMessage = null;
    this.cdRef.detectChanges();
    this.showTemporaryStatus();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      const videoTrack = this.stream.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState !== 'live') {
        throw new Error('Camera stream not active');
      }

      this.videoPreview.nativeElement.srcObject = this.stream;

      await new Promise<void>((resolve) => {
        this.videoPreview.nativeElement.onplaying = () => resolve();
      });

      this.currentState = RecorderState.CameraReady;
      this.cdRef.detectChanges();
      this.showTemporaryStatus();
    } catch (error: any) {
      console.error('Camera error:', error);
      this.cameraErrorMessage = this.getFriendlyCameraError(error);
      this.currentState = RecorderState.CameraError;
      this.cdRef.detectChanges();
      this.showTemporaryStatus();
    }
  }

  private getFriendlyCameraError(error: any): string {
    if (error.name === 'NotAllowedError') {
      return 'Camera access denied. Please grant permission in your browser settings.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera found. Please ensure a camera is connected and enabled.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Camera is already in use by another application or device.';
    } else if (error.name === 'OverconstrainedError') {
      return 'Camera constraints could not be satisfied.';
    }
    return 'An unexpected camera error occurred.';
  }

  stopCameraStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.videoPreview.nativeElement.srcObject = null;
  }

  async startRecording() {
    if (this.currentState !== RecorderState.CameraReady && this.currentState !== RecorderState.RecordingComplete) {
      await this.initializeCamera();
    }

    if (!this.stream) {
      console.error('Cannot start recording: No active media stream.');
      return;
    }

    try {
      this.recordedChunks = [];
      const mimeTypes = [
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];

      const supportedMimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: supportedMimeType || 'video/webm',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm',
        });
        this.videoUrl = URL.createObjectURL(blob);
        this.currentState = RecorderState.RecordingComplete;
        this.stopCameraStream();
        this.videoPreview.nativeElement.src = this.videoUrl;
        this.videoPreview.nativeElement.controls = true;
        this.videoPreview.nativeElement.loop = false;
        this.showTemporaryStatus();
      };

      this.mediaRecorder.start();
      this.currentState = RecorderState.Recording;
      this.showTemporaryStatus();
    } catch (error) {
      console.error('Error starting recording:', error);
      this.currentState = this.stream ? RecorderState.CameraReady : RecorderState.CameraOff;
      this.showTemporaryStatus();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  stopCamera() {
    this.stopCameraStream();
    this.currentState = RecorderState.CameraOff;
    this.showTemporaryStatus();
  }

  playRecording() {
    if (this.videoUrl && this.videoPreview.nativeElement) {
      this.videoPreview.nativeElement.play();
    }
  }

  downloadRecording() {
    if (this.videoUrl) {
      const link = document.createElement('a');
      link.href = this.videoUrl;
      link.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  recordAgain() {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
      this.videoUrl = null;
    }

    this.recordedChunks = [];
    this.videoPreview.nativeElement.src = '';
    this.videoPreview.nativeElement.srcObject = null;
    this.videoPreview.nativeElement.controls = false;

    this.initializeCamera();
  }

  closeModal() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.stopCameraStream();

    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
      this.videoUrl = null;
    }

    this.recordedChunks = [];
    this.cameraErrorMessage = null;
    this.videoPreview.nativeElement.src = '';
    this.videoPreview.nativeElement.srcObject = null;
    this.videoPreview.nativeElement.controls = false;
    this.currentState = RecorderState.CameraOff;
    this.recorderService.hide();
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    this.closeModal();
  }
}
