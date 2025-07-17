// src/app/settings/account-content/account-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-account-content',
  template: `
    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Profile & Security</ion-label>
      </ion-list-header>

      <ion-item button detail (click)="openEditProfileModal()">
        <ion-icon slot="start" name="person-outline"></ion-icon>
        <ion-label>
          <h2>Edit Profile</h2>
          <p>Update your name, avatar, and handle.</p>
        </ion-label>
      </ion-item>

      <ion-item button detail (click)="openChangePasswordModal()">
        <ion-icon slot="start" name="lock-closed-outline"></ion-icon>
        <ion-label>
          <h2>Change Password</h2>
          <p>Update your account password.</p>
        </ion-label>
      </ion-item>

      <ion-item lines="full" button detail (click)="openConnectedAccounts()">
        <ion-icon slot="start" name="link-outline"></ion-icon>
        <ion-label>
          <h2>Connected Accounts</h2>
          <p>Manage integrations with YouTube and other services.</p>
        </ion-label>
      </ion-item>
    </ion-list>

    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Content Preferences</ion-label>
      </ion-list-header>

      <ion-item button detail (click)="openVideoQualitySettings()">
        <ion-icon slot="start" name="videocam-outline"></ion-icon>
        <ion-label>
          <h2>Video Quality</h2>
          <p>Preferred playback quality (Auto by default)</p>
        </ion-label>
      </ion-item>

      <ion-item button detail (click)="openAutoplaySettings()">
        <ion-icon slot="start" name="play-forward-outline"></ion-icon>
        <ion-label>
          <h2>Autoplay</h2>
          <p>Control whether videos play automatically</p>
        </ion-label>
      </ion-item>

      <ion-item button detail (click)="openCaptionsSettings()">
        <ion-icon slot="start" name="text-outline"></ion-icon>
        <ion-label>
          <h2>Captions & Subtitles</h2>
          <p>Default caption preferences</p>
        </ion-label>
      </ion-item>

      <ion-item lines="full" button detail (click)="openRegionSettings()">
        <ion-icon slot="start" name="globe-outline"></ion-icon>
        <ion-label>
          <h2>Content Region</h2>
          <p>Preferred content location ({{currentRegion}})</p>
        </ion-label>
      </ion-item>
    </ion-list>

    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">API & Data</ion-label>
      </ion-list-header>

      <ion-item button detail (click)="openApiSettings()">
        <ion-icon slot="start" name="code-outline"></ion-icon>
        <ion-label>
          <h2>YouTube API Settings</h2>
          <p>Configure API keys and quotas</p>
        </ion-label>
      </ion-item>

      <ion-item button detail (click)="openDataUsage()">
        <ion-icon slot="start" name="stats-chart-outline"></ion-icon>
        <ion-label>
          <h2>Data Usage</h2>
          <p>Control how much data the app uses</p>
        </ion-label>
      </ion-item>

      <ion-item lines="full" button detail (click)="openCacheSettings()">
        <ion-icon slot="start" name="archive-outline"></ion-icon>
        <ion-label>
          <h2>Cache Management</h2>
          <p>Manage stored video data ({{cacheSize}})</p>
        </ion-label>
      </ion-item>
    </ion-list>

    <ion-list lines="none" class="settings-list">
      <ion-item lines="none" button class="logout-item" (click)="logout()">
        <ion-icon slot="start" name="log-out-outline" color="danger"></ion-icon>
        <ion-label color="danger">Logout</ion-label>
      </ion-item>
    </ion-list>

    <ion-button expand="block" fill="outline" color="danger" (click)="deleteAccount()" class="delete-account-button">
      Delete Account
    </ion-button>
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
    .logout-item {
      --padding-top: 10px;
      --padding-bottom: 10px;
    }
    .delete-account-button {
      margin-top: 20px;
      --border-width: 1px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AccountContentComponent implements OnInit {
  currentRegion = 'International';
  cacheSize = '0 MB';

  constructor() {}
  ngOnInit() {}

  // Profile & Security
  openEditProfileModal() { console.log('Open Edit Profile Modal'); }
  openChangePasswordModal() { console.log('Open Change Password Modal'); }
  openConnectedAccounts() { console.log('Open Connected Accounts'); }

  // Content Preferences
  openVideoQualitySettings() { console.log('Open Video Quality Settings'); }
  openAutoplaySettings() { console.log('Open Autoplay Settings'); }
  openCaptionsSettings() { console.log('Open Captions Settings'); }
  openRegionSettings() { console.log('Open Region Settings'); }

  // API & Data
  openApiSettings() { console.log('Open YouTube API Settings'); }
  openDataUsage() { console.log('Open Data Usage Settings'); }
  openCacheSettings() { console.log('Open Cache Settings'); }

  // Account actions
  logout() { console.log('User logout initiated'); }
  deleteAccount() { console.log('User delete account initiated'); }
}
