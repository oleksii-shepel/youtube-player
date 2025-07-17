// src/app/settings/shorts-content/shorts-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-shorts-content',
  template: `
    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Shorts Playback</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="repeat-outline"></ion-icon>
        <ion-label>
          <h2>Loop Shorts Automatically</h2>
          <p>Replay shorts when they finish.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="loopShorts" (ionChange)="updateLoopShorts()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="volume-high-outline"></ion-icon>
        <ion-label>
          <h2>Shorts Volume</h2>
          <p>Initial volume level for Shorts.</p>
        </ion-label>
        <ion-range slot="end" min="0" max="100" step="10" [(ngModel)]="shortsVolume" (ionChange)="updateShortsVolume()">
            <ion-icon slot="start" name="volume-mute-outline"></ion-icon>
            <ion-icon slot="end" name="volume-high-outline"></ion-icon>
        </ion-range>
      </ion-item>

      <ion-list-header>
        <ion-label color="tertiary">Content Preferences</ion-label>
      </ion-list-header>

      <ion-item lines="full">
        <ion-icon slot="start" name="filter-outline"></ion-icon>
        <ion-label>
          <h2>Filter Mature Shorts</h2>
          <p>Hide potentially sensitive content.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="filterMatureShorts" (ionChange)="updateFilterMatureShorts()"></ion-toggle>
      </ion-item>

      <ion-item lines="none">
        <ion-icon slot="start" name="thumbs-down-outline"></ion-icon>
        <ion-label>
          <h2>Exclude Disliked Shorts</h2>
          <p>Do not show shorts you have disliked.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="excludeDislikedShorts" (ionChange)="updateExcludeDislikedShorts()"></ion-toggle>
      </ion-item>
    </ion-list>
  `,
  styles: [`
    .settings-list {
      background: var(--ion-card-background);
      margin-top: 16px;
      border-radius: 8px;
      border: 1px solid var(--ion-card-border-color);
    }
    ion-list-header {
      padding-top: 15px;
      padding-bottom: 5px;
      --ion-color-base: transparent;
    }
    ion-list-header ion-label {
      font-weight: bold;
      font-size: 1.1em;
    }
    ion-item {
      --background: var(--ion-card-background);
      --border-color: var(--ion-item-border-color);
      --padding-start: 16px;
      --inner-padding-end: 16px;
      color: var(--ion-text-color);
    }
    ion-item ion-icon {
        color: var(--ion-text-color-secondary);
    }
    ion-item h2 {
      font-size: 1.1em;
      margin-bottom: 4px;
      color: var(--ion-text-color-heading);
    }
    ion-item p {
      font-size: 0.85em;
      color: var(--ion-text-color-secondary);
      margin-top: 0;
    }
    ion-toggle {
        margin-inline-start: auto;
    }
    ion-range {
        width: 120px; /* Adjust as needed */
        padding-inline: 0; /* Remove default padding from range */
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ShortsContentComponent implements OnInit {
  loopShorts: boolean = true;
  shortsVolume: number = 70;
  filterMatureShorts: boolean = false;
  excludeDislikedShorts: boolean = true;

  constructor() {}
  ngOnInit() {}

  updateLoopShorts() { console.log('Loop Shorts:', this.loopShorts); }
  updateShortsVolume() { console.log('Shorts Volume:', this.shortsVolume); }
  updateFilterMatureShorts() { console.log('Filter Mature Shorts:', this.filterMatureShorts); }
  updateExcludeDislikedShorts() { console.log('Exclude Disliked Shorts:', this.excludeDislikedShorts); }
}
