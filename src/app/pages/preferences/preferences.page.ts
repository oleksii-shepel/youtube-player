// src/app/settings/preferences-content/preferences-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { IonicModule, Platform } from '@ionic/angular';

@Component({
  selector: 'app-preferences-content',
  template: `
    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Display & Behavior</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-icon slot="start" name="moon-outline"></ion-icon>
        <ion-label>
          <h2>Dark Mode</h2>
          <p>Enable or disable dark theme.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="isDarkModeEnabled" (ionChange)="toggleDarkMode()"></ion-toggle>
      </ion-item>

      <ion-item button detail (click)="openLanguageSettings()">
        <ion-icon slot="start" name="language-outline"></ion-icon>
        <ion-label>
          <h2>Language</h2>
          <p>{{ selectedLanguage }}</p>
        </ion-label>
      </ion-item>

      <ion-item button detail (click)="openRegionSettings()">
        <ion-icon slot="start" name="globe-outline"></ion-icon>
        <ion-label>
          <h2>Region & Content Preferences</h2>
          <p>{{ selectedRegion }}</p>
        </ion-label>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="notifications-outline"></ion-icon>
        <ion-label>
          <h2>Notifications</h2>
          <p>Receive push notifications and alerts.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="receiveNotifications" (ionChange)="updateNotifications()"></ion-toggle>
      </ion-item>

      <ion-item>
        <ion-icon slot="start" name="play-skip-forward-outline"></ion-icon>
        <ion-label>
          <h2>Autoplay Next Video</h2>
          <p>Automatically play next recommended video.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="autoplayEnabled" (ionChange)="updateAutoplay()"></ion-toggle>
      </ion-item>

      <ion-item lines="full">
        <ion-icon slot="start" name="videocam-outline"></ion-icon>
        <ion-label>
          <h2>Default Video Quality</h2>
          <p>Set preferred streaming resolution.</p>
        </ion-label>
        <ion-select slot="end" interface="popover" [(ngModel)]="defaultVideoQuality" (ionChange)="updateVideoQuality()">
          <ion-select-option value="auto">Auto</ion-select-option>
          <ion-select-option value="1080p">1080p (Full HD)</ion-select-option>
          <ion-select-option value="720p">720p (HD)</ion-select-option>
          <ion-select-option value="480p">480p (SD)</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item lines="none">
        <ion-icon slot="start" name="volume-high-outline"></ion-icon>
        <ion-label>
          <h2>Sound Effects</h2>
          <p>Enable in-app sound effects.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="soundEffectsEnabled" (ionChange)="updateSoundEffects()"></ion-toggle>
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
        margin-inline-start: auto; /* Push to end */
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule] // Add FormsModule for ngModel
})
export class PreferencesContentComponent implements OnInit {
  isDarkModeEnabled: boolean = true; // Example state
  receiveNotifications: boolean = true;
  autoplayEnabled: boolean = true;
  soundEffectsEnabled: boolean = false;
  selectedLanguage: string = 'English (US)';
  selectedRegion: string = 'Global';
  defaultVideoQuality: string = 'auto';

  constructor(private platform: Platform) {}

  ngOnInit() {
    // Initialize states from local storage or user settings service here
    // Example: this.isDarkModeEnabled = localStorage.getItem('darkMode') === 'true';
  }

  toggleDarkMode() {
    console.log('Dark mode toggled:', this.isDarkModeEnabled);
    document.body.classList.toggle('dark-theme', this.isDarkModeEnabled);
    // You'd typically save this preference to localStorage or a user settings service
    // localStorage.setItem('darkMode', this.isDarkModeEnabled.toString());
  }

  openLanguageSettings() { console.log('Open Language Settings'); /* e.g., open a modal with language options */ }
  openRegionSettings() { console.log('Open Region Settings'); /* e.g., open a modal with region options */ }
  updateNotifications() { console.log('Notifications updated:', this.receiveNotifications); }
  updateAutoplay() { console.log('Autoplay updated:', this.autoplayEnabled); }
  updateVideoQuality() { console.log('Video quality updated:', this.defaultVideoQuality); }
  updateSoundEffects() { console.log('Sound effects updated:', this.soundEffectsEnabled); }
}
