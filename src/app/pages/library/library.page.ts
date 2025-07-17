// src/app/settings/library-content/library-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-library-content',
  template: `
    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Downloads</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="cloud-download-outline"></ion-icon>
        <ion-label>
          <h2>Download Quality</h2>
          <p>Choose the quality for offline videos.</p>
        </ion-label>
        <ion-select slot="end" interface="popover" [(ngModel)]="downloadQuality" (ionChange)="updateDownloadQuality()">
          <ion-select-option value="hd">HD (1080p)</ion-select-option>
          <ion-select-option value="sd">SD (480p)</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item lines="full">
        <ion-icon slot="start" name="wifi-outline"></ion-icon>
        <ion-label>
          <h2>Download over Wi-Fi Only</h2>
          <p>Prevent mobile data usage for downloads.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="wifiOnlyDownloads" (ionChange)="updateWifiOnlyDownloads()"></ion-toggle>
      </ion-item>

      <ion-list-header>
        <ion-label color="tertiary">Playlists & Saved</ion-label>
      </ion-list-header>

      <ion-item button detail (click)="openMyPlaylists()">
        <ion-icon slot="start" name="albums-outline"></ion-icon>
        <ion-label>
          <h2>My Playlists</h2>
          <p>Manage your created and saved playlists.</p>
        </ion-label>
      </ion-item>

      <ion-item lines="full" button detail (click)="openWatchLater()">
        <ion-icon slot="start" name="time-outline"></ion-icon>
        <ion-label>
          <h2>Watch Later</h2>
          <p>Access your saved videos to watch later.</p>
        </ion-label>
      </ion-item>

      <ion-item lines="none" button (click)="clearAllLibraryData()">
        <ion-icon slot="start" name="trash-bin-outline" color="danger"></ion-icon>
        <ion-label color="danger">Clear All Library Data</ion-label>
        <p>Removes all downloads, watch later, and custom playlists.</p>
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
    ion-toggle, ion-select {
        margin-inline-start: auto;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class LibraryContentComponent implements OnInit {
  downloadQuality: string = 'hd';
  wifiOnlyDownloads: boolean = true;

  constructor() {}
  ngOnInit() {}

  updateDownloadQuality() { console.log('Download quality set to:', this.downloadQuality); }
  updateWifiOnlyDownloads() { console.log('Wi-Fi only downloads:', this.wifiOnlyDownloads); }
  openMyPlaylists() { console.log('Open My Playlists page'); }
  openWatchLater() { console.log('Open Watch Later list'); }
  clearAllLibraryData() { console.log('Clear All Library Data (downloads, playlists, watch later)'); /* Confirmation needed */ }
}
