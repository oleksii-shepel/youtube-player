// src/app/settings/history-content/history-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-history-content',
  template: `
    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Viewing History</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="time-outline"></ion-icon>
        <ion-label>
          <h2>Pause Viewing History</h2>
          <p>Videos you watch won't appear in your history.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="pauseViewingHistory" (ionChange)="updatePauseViewingHistory()"></ion-toggle>
      </ion-item>

      <ion-item button (click)="clearViewingHistory()">
        <ion-icon slot="start" name="trash-outline"></ion-icon>
        <ion-label>
          <h2>Clear All Viewing History</h2>
          <p>Permanently deletes all videos from your watch history.</p>
        </ion-label>
      </ion-item>

      <ion-list-header>
        <ion-label color="tertiary">Search History</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="search-outline"></ion-icon>
        <ion-label>
          <h2>Pause Search History</h2>
          <p>Searches won't be saved to your history.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="pauseSearchHistory" (ionChange)="updatePauseSearchHistory()"></ion-toggle>
      </ion-item>

      <ion-item lines="full" button (click)="clearSearchHistory()">
        <ion-icon slot="start" name="trash-outline"></ion-icon>
        <ion-label>
          <h2>Clear All Search History</h2>
          <p>Permanently deletes all your past searches.</p>
        </ion-label>
      </ion-item>

      <ion-list-header>
        <ion-label color="tertiary">Recommendations</ion-label>
      </ion-list-header>

      <ion-item lines="none" button (click)="resetRecommendations()">
        <ion-icon slot="start" name="reload-outline"></ion-icon>
        <ion-label>
          <h2>Reset Recommendations</h2>
          <p>Clears your watch history and influences for new recommendations.</p>
        </ion-label>
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
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class HistoryContentComponent implements OnInit {
  pauseViewingHistory: boolean = false;
  pauseSearchHistory: boolean = false;

  constructor() {}
  ngOnInit() {}

  updatePauseViewingHistory() { console.log('Pause Viewing History:', this.pauseViewingHistory); }
  clearViewingHistory() { console.log('Clear All Viewing History'); /* Confirmation needed */ }
  updatePauseSearchHistory() { console.log('Pause Search History:', this.pauseSearchHistory); }
  clearSearchHistory() { console.log('Clear All Search History'); /* Confirmation needed */ }
  resetRecommendations() { console.log('Reset Recommendations'); /* Confirmation needed */ }
}
