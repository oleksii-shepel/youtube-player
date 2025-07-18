// src/app/settings/preferences-content/preferences-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, Platform } from '@ionic/angular';

@Component({
  selector: 'app-appearance-content',
  template: `
    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Display & Theme</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="moon-outline"></ion-icon>
        <ion-label>
          <h2>Dark Mode</h2>
          <p>Enable or disable dark theme.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="isDarkModeEnabled" (ionChange)="toggleDarkMode()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="color-palette-outline"></ion-icon>
        <ion-label>
          <h2>App Theme</h2>
          <p>Choose your preferred color theme.</p>
        </ion-label>
        <ion-select slot="end" interface="popover" [(ngModel)]="selectedTheme" (ionChange)="updateTheme()">
          <ion-select-option value="default">Default</ion-select-option>
          <ion-select-option value="blue">Blue</ion-select-option>
          <ion-select-option value="green">Green</ion-select-option>
          <ion-select-option value="purple">Purple</ion-select-option>
          <ion-select-option value="orange">Orange</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="text-outline"></ion-icon>
        <ion-label>
          <h2>Font Size</h2>
          <p>Adjust text size for better readability.</p>
        </ion-label>
        <ion-select slot="end" interface="popover" [(ngModel)]="fontSize" (ionChange)="updateFontSize()">
          <ion-select-option value="small">Small</ion-select-option>
          <ion-select-option value="medium">Medium</ion-select-option>
          <ion-select-option value="large">Large</ion-select-option>
          <ion-select-option value="extra-large">Extra Large</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item lines="full">
        <ion-icon slot="start" name="language-outline"></ion-icon>
        <ion-label>
          <h2>Language</h2>
          <p>{{ selectedLanguage }}</p>
        </ion-label>
        <ion-select slot="end" interface="popover" [(ngModel)]="selectedLanguage" (ionChange)="updateLanguage()">
          <ion-select-option value="English (US)">English (US)</ion-select-option>
          <ion-select-option value="English (UK)">English (UK)</ion-select-option>
          <ion-select-option value="Spanish">Español</ion-select-option>
          <ion-select-option value="French">Français</ion-select-option>
          <ion-select-option value="German">Deutsch</ion-select-option>
          <ion-select-option value="Italian">Italiano</ion-select-option>
          <ion-select-option value="Portuguese">Português</ion-select-option>
          <ion-select-option value="Japanese">日本語</ion-select-option>
          <ion-select-option value="Korean">한국어</ion-select-option>
          <ion-select-option value="Chinese">中文</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>

    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Interface & Navigation</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="grid-outline"></ion-icon>
        <ion-label>
          <h2>Grid View</h2>
          <p>Number of columns in video grid.</p>
        </ion-label>
        <ion-select slot="end" interface="popover" [(ngModel)]="gridColumns" (ionChange)="updateGridView()">
          <ion-select-option value="1">1 Column</ion-select-option>
          <ion-select-option value="2">2 Columns</ion-select-option>
          <ion-select-option value="3">3 Columns</ion-select-option>
          <ion-select-option value="4">4 Columns</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="apps-outline"></ion-icon>
        <ion-label>
          <h2>Show Thumbnails</h2>
          <p>Display video thumbnails in lists.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="showThumbnails" (ionChange)="updateThumbnails()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="time-outline"></ion-icon>
        <ion-label>
          <h2>Show Duration</h2>
          <p>Display video duration on thumbnails.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="showDuration" (ionChange)="updateDuration()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="eye-outline"></ion-icon>
        <ion-label>
          <h2>Show View Count</h2>
          <p>Display view count on video items.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="showViewCount" (ionChange)="updateViewCount()"></ion-toggle>
      </ion-item>

      <ion-item lines="full">
        <ion-icon slot="start" name="refresh-outline"></ion-icon>
        <ion-label>
          <h2>Auto Refresh</h2>
          <p>Automatically refresh content feeds.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="autoRefresh" (ionChange)="updateAutoRefresh()"></ion-toggle>
      </ion-item>
    </ion-list>

    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Notifications & Alerts</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="notifications-outline"></ion-icon>
        <ion-label>
          <h2>Push Notifications</h2>
          <p>Receive notifications for new content.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="pushNotifications" (ionChange)="updatePushNotifications()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="mail-outline"></ion-icon>
        <ion-label>
          <h2>Email Notifications</h2>
          <p>Receive email updates and newsletters.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="emailNotifications" (ionChange)="updateEmailNotifications()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="alert-circle-outline"></ion-icon>
        <ion-label>
          <h2>Error Alerts</h2>
          <p>Show alerts for errors and issues.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="errorAlerts" (ionChange)="updateErrorAlerts()"></ion-toggle>
      </ion-item>

      <ion-item lines="full">
        <ion-icon slot="start" name="volume-high-outline"></ion-icon>
        <ion-label>
          <h2>Sound Effects</h2>
          <p>Enable in-app sound effects.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="soundEffectsEnabled" (ionChange)="updateSoundEffects()"></ion-toggle>
      </ion-item>
    </ion-list>

    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Performance & Behavior</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="speedometer-outline"></ion-icon>
        <ion-label>
          <h2>Animation Speed</h2>
          <p>Control interface animation speed.</p>
        </ion-label>
        <ion-select slot="end" interface="popover" [(ngModel)]="animationSpeed" (ionChange)="updateAnimationSpeed()">
          <ion-select-option value="slow">Slow</ion-select-option>
          <ion-select-option value="normal">Normal</ion-select-option>
          <ion-select-option value="fast">Fast</ion-select-option>
          <ion-select-option value="disabled">Disabled</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="phone-portrait-outline"></ion-icon>
        <ion-label>
          <h2>Keep Screen On</h2>
          <p>Prevent screen from turning off during playback.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="keepScreenOn" (ionChange)="updateKeepScreenOn()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="arrow-back-outline"></ion-icon>
        <ion-label>
          <h2>Double Tap to Exit</h2>
          <p>Require double tap to exit the app.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="doubleTapExit" (ionChange)="updateDoubleTapExit()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="download-outline"></ion-icon>
        <ion-label>
          <h2>Background Downloads</h2>
          <p>Allow downloads to continue in background.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="backgroundDownloads" (ionChange)="updateBackgroundDownloads()"></ion-toggle>
      </ion-item>

      <ion-item lines="none">
        <ion-icon slot="start" name="analytics-outline"></ion-icon>
        <ion-label>
          <h2>Usage Analytics</h2>
          <p>Help improve the app by sharing usage data.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="usageAnalytics" (ionChange)="updateUsageAnalytics()"></ion-toggle>
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
export class AppearanceContentComponent implements OnInit {
  // Display & Theme
  isDarkModeEnabled: boolean = true;
  selectedTheme: string = 'default';
  fontSize: string = 'medium';
  selectedLanguage: string = 'English (US)';

  // Interface & Navigation
  gridColumns: string = '2';
  showThumbnails: boolean = true;
  showDuration: boolean = true;
  showViewCount: boolean = true;
  autoRefresh: boolean = true;

  // Notifications & Alerts
  pushNotifications: boolean = true;
  emailNotifications: boolean = false;
  errorAlerts: boolean = true;
  soundEffectsEnabled: boolean = false;

  // Performance & Behavior
  animationSpeed: string = 'normal';
  keepScreenOn: boolean = false;
  doubleTapExit: boolean = false;
  backgroundDownloads: boolean = true;
  usageAnalytics: boolean = true;

  constructor(private platform: Platform) {}

  ngOnInit() {
    // Initialize states from local storage or user settings service
  }

  // Display & Theme methods
  toggleDarkMode() {
    console.log('Dark mode toggled:', this.isDarkModeEnabled);
    document.body.classList.toggle('dark-theme', this.isDarkModeEnabled);
  }

  updateTheme() {
    console.log('Theme updated:', this.selectedTheme);
    // Apply theme changes
  }

  updateFontSize() {
    console.log('Font size updated:', this.fontSize);
    // Apply font size changes to root element
  }

  updateLanguage() {
    console.log('Language updated:', this.selectedLanguage);
    // Apply language changes
  }

  // Interface & Navigation methods
  updateGridView() {
    console.log('Grid columns updated:', this.gridColumns);
  }

  updateThumbnails() {
    console.log('Show thumbnails updated:', this.showThumbnails);
  }

  updateDuration() {
    console.log('Show duration updated:', this.showDuration);
  }

  updateViewCount() {
    console.log('Show view count updated:', this.showViewCount);
  }

  updateAutoRefresh() {
    console.log('Auto refresh updated:', this.autoRefresh);
  }

  // Notifications & Alerts methods
  updatePushNotifications() {
    console.log('Push notifications updated:', this.pushNotifications);
  }

  updateEmailNotifications() {
    console.log('Email notifications updated:', this.emailNotifications);
  }

  updateErrorAlerts() {
    console.log('Error alerts updated:', this.errorAlerts);
  }

  updateSoundEffects() {
    console.log('Sound effects updated:', this.soundEffectsEnabled);
  }

  // Performance & Behavior methods
  updateAnimationSpeed() {
    console.log('Animation speed updated:', this.animationSpeed);
  }

  updateKeepScreenOn() {
    console.log('Keep screen on updated:', this.keepScreenOn);
  }

  updateDoubleTapExit() {
    console.log('Double tap exit updated:', this.doubleTapExit);
  }

  updateBackgroundDownloads() {
    console.log('Background downloads updated:', this.backgroundDownloads);
  }

  updateUsageAnalytics() {
    console.log('Usage analytics updated:', this.usageAnalytics);
  }
}
