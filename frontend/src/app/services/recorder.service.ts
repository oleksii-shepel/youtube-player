import { Injectable } from '@angular/core';
import { createBehaviorSubject, createReplaySubject, Stream } from '@epikodelabs/streamix';

@Injectable({ providedIn: 'root' })
export class RecorderService {
  private _isHidden = createBehaviorSubject<boolean>(true);
  private _isRecording = createBehaviorSubject<boolean>(false);

  isHidden$ = this._isHidden;
  isRecording$ = this._isRecording;

  constructor() {
    this._isHidden.next(true);
    this._isRecording.next(false);
  }

  /** Show the recorder modal */
  show(): void {
    this._isHidden.next(false);
  }

  /** Hide the recorder modal */
  hide(): void {
    this._isHidden.next(true);
    this._isRecording.next(false);
  }

  /** Start recording session */
  startRecording(): void {
    this._isRecording.next(true);
  }

  /** Stop recording session */
  stopRecording(): void {
    this._isRecording.next(false);
  }

  /** Toggle modal visibility */
  toggle(): void {
    this._isHidden.next(!this.getLastHiddenState());
  }

  /** Optionally get current internal hidden state */
  private lastHidden: boolean = true;

  private getLastHiddenState(): boolean {
    return this.lastHidden;
  }

  /** You may optionally expose setters if needed */
  setHidden(value: boolean) {
    this.lastHidden = value;
    this._isHidden.next(value);
  }
}
