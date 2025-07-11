import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RecorderService } from 'src/app/services/recorder.service';

@Component({
  standalone: true,
  selector: 'app-recorder',
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="modal-container"
      [class.hidden]="isHidden"
    >
      <video #videoPreview autoplay muted playsinline></video>
      <div class="controls">
        <ion-button (click)="startRecording()" [disabled]="isRecording">Start</ion-button>
        <ion-button (click)="stopRecording()" [disabled]="!isRecording">Stop</ion-button>
        <ion-button *ngIf="videoUrl" [href]="videoUrl" download="recording.webm">Download</ion-button>
        <ion-button (click)="closeModal()">Close</ion-button>
      </div>
    </div>
  `,
  styles: [
    `
    .modal-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 375px;
      background: #1a1a1a;
      padding: 16px;
      border-radius: 12px;
      z-index: 1001;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    video {
      width: 100%;
      height: auto;
      background: black;
    }
    .controls {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }
    .hidden {
      display: none;
    }
    `,
  ],
})
export class RecorderComponent {
  @Input() isHidden = true;
  @Output() close = new EventEmitter<void>();

  @ViewChild('videoPreview', { static: true }) videoPreview!: ElementRef<HTMLVideoElement>;

  private mediaRecorder!: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  isRecording = false;
  videoUrl: string | null = null;

  constructor(private recorderService: RecorderService) {

  }

  async startRecording() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.videoPreview.nativeElement.srcObject = this.stream;

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'video/webm; codecs=vp9',
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      this.videoUrl = URL.createObjectURL(blob);
    };

    this.mediaRecorder?.start();
    this.isRecording = true;
  }

  stopRecording() {
    this.mediaRecorder?.stop();
    this.stream?.getTracks().forEach(track => track.stop());
    this.isRecording = false;
  }

  closeModal() {
    this.stopRecording();
    this.recorderService.hide();
    this.close.emit();
  }
}
