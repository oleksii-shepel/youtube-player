// src/app/settings/app-settings-content/app-settings-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-app-settings-content',
  template: `
    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">App Data & Cache</ion-label>
      </ion-list-header>

      <ion-item button (click)="clearCache()">
        <ion-icon slot="start" name="trash-outline"></ion-icon>
        <ion-label>
          <h2>Clear Cache</h2>
          <p>Frees up storage space used by cached content.</p>
        </ion-label>
        <ion-text slot="end" color="medium">120 MB</ion-text>
      </ion-item>

      <ion-item button (click)="clearDownloads()">
        <ion-icon slot="start" name="cloud-offline-outline"></ion-icon>
        <ion-label>
          <h2>Clear Downloads</h2>
          <p>Remove all downloaded videos and media.</p>
        </ion-label>
        <ion-text slot="end" color="medium">5.2 GB</ion-text>
      </ion-item>

      <ion-list-header>
        <ion-label color="tertiary">Advanced</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="bug-outline"></ion-icon>
        <ion-label>
          <h2>Send Crash Reports</h2>
          <p>Help us improve by sending anonymous crash data.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="sendCrashReports"></ion-toggle>
      </ion-item>

      <ion-item lines="full" button (click)="checkAppVersion()">
        <ion-icon slot="start" name="information-circle-outline"></ion-icon>
        <ion-label>
          <h2>App Version</h2>
          <p>{{ appVersion }}</p>
        </ion-label>
        <ion-text slot="end" color="medium">{{ buildNumber }}</ion-text>
      </ion-item>

      <ion-item lines="none" button (click)="openAboutPage()">
        <ion-icon slot="start" name="receipt-outline"></ion-icon>
        <ion-label>
          <h2>About App</h2>
          <p>Licenses, Terms of Service, Privacy Policy.</p>
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
export class AppSettingsContentComponent implements OnInit {
  appVersion: string = '1.2.3';
  buildNumber: string = '20250717.b1';
  sendCrashReports: boolean = true;

  constructor() {}
  ngOnInit() {}

  clearCache() { console.log('Cache cleared'); /* Implement cache clearing logic */ }
  clearDownloads() { console.log('Downloads cleared'); /* Implement downloads clearing logic */ }
  checkAppVersion() { console.log('Checking for app updates...'); /* Implement update check */ }
  openAboutPage() { console.log('Navigate to About page'); /* Implement routing to a dedicated About page */ }
}
