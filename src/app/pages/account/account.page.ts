// src/app/settings/account-content/account-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account-content',
  template: `
    <ion-accordion-group [multiple]="true" class="settings-accordion-group">

      <!-- Profile & Security Section -->
      <ion-accordion value="profile-security">
        <ion-item slot="header">
          <ion-icon slot="start" name="person-outline"></ion-icon>
          <ion-label>
            <h2>Profile & Security</h2>
            <p>Manage your account details and security</p>
          </ion-label>
        </ion-item>

        <div slot="content" class="accordion-content">
          <!-- Edit Profile -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Edit Profile</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="stacked">Display Name</ion-label>
                <ion-input [(ngModel)]="profileData.displayName" placeholder="Enter your name"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Handle</ion-label>
                <ion-input [(ngModel)]="profileData.handle" placeholder="@username"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Avatar</ion-label>
                <ion-button fill="outline" (click)="selectAvatar()">
                  <ion-icon slot="start" name="camera-outline"></ion-icon>
                  Change Avatar
                </ion-button>
              </ion-item>
              <ion-button expand="block" (click)="saveProfile()">Save Profile</ion-button>
            </ion-card-content>
          </ion-card>

          <!-- Change Password -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Change Password</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="stacked">Current Password</ion-label>
                <ion-input type="password" [(ngModel)]="passwordData.currentPassword"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">New Password</ion-label>
                <ion-input type="password" [(ngModel)]="passwordData.newPassword"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Confirm New Password</ion-label>
                <ion-input type="password" [(ngModel)]="passwordData.confirmPassword"></ion-input>
              </ion-item>
              <ion-button expand="block" (click)="changePassword()">Update Password</ion-button>
            </ion-card-content>
          </ion-card>

          <!-- Connected Accounts -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Connected Accounts</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item *ngFor="let account of connectedAccounts">
                <ion-avatar slot="start">
                  <ion-icon [name]="account.icon"></ion-icon>
                </ion-avatar>
                <ion-label>
                  <h3>{{account.name}}</h3>
                  <p>{{account.status}}</p>
                </ion-label>
                <ion-button slot="end" fill="outline" [color]="account.connected ? 'danger' : 'primary'"
                           (click)="toggleConnection(account)">
                  {{account.connected ? 'Disconnect' : 'Connect'}}
                </ion-button>
              </ion-item>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-accordion>

      <!-- Content Preferences Section -->
      <ion-accordion value="content-preferences">
        <ion-item slot="header">
          <ion-icon slot="start" name="settings-outline"></ion-icon>
          <ion-label>
            <h2>Content Preferences</h2>
            <p>Customize your viewing experience</p>
          </ion-label>
        </ion-item>

        <div slot="content" class="accordion-content">
          <!-- Video Quality -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Video Quality</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-radio-group [(ngModel)]="contentPreferences.videoQuality">
                <ion-item *ngFor="let quality of videoQualities">
                  <ion-label>{{quality.label}}</ion-label>
                  <ion-radio slot="end" [value]="quality.value"></ion-radio>
                </ion-item>
              </ion-radio-group>
            </ion-card-content>
          </ion-card>

          <!-- Autoplay -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Autoplay Settings</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Enable Autoplay</ion-label>
                <ion-toggle [(ngModel)]="contentPreferences.autoplay" slot="end"></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-label>Autoplay on Mobile Data</ion-label>
                <ion-toggle [(ngModel)]="contentPreferences.autoplayMobile" slot="end"></ion-toggle>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Captions -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Captions & Subtitles</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Enable Captions</ion-label>
                <ion-toggle [(ngModel)]="contentPreferences.captions" slot="end"></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Caption Language</ion-label>
                <ion-select [(ngModel)]="contentPreferences.captionLanguage">
                  <ion-select-option value="en">English</ion-select-option>
                  <ion-select-option value="es">Spanish</ion-select-option>
                  <ion-select-option value="fr">French</ion-select-option>
                  <ion-select-option value="de">German</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Region -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Content Region</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="stacked">Preferred Region</ion-label>
                <ion-select [(ngModel)]="contentPreferences.region">
                  <ion-select-option value="international">International</ion-select-option>
                  <ion-select-option value="us">United States</ion-select-option>
                  <ion-select-option value="uk">United Kingdom</ion-select-option>
                  <ion-select-option value="ca">Canada</ion-select-option>
                  <ion-select-option value="au">Australia</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-accordion>

      <!-- API & Data Section -->
      <ion-accordion value="api-data">
        <ion-item slot="header">
          <ion-icon slot="start" name="code-outline"></ion-icon>
          <ion-label>
            <h2>API & Data</h2>
            <p>Manage API settings and data usage</p>
          </ion-label>
        </ion-item>

        <div slot="content" class="accordion-content">
          <!-- YouTube API Settings -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>YouTube API Settings</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="stacked">API Key</ion-label>
                <ion-input [(ngModel)]="apiSettings.apiKey" placeholder="Enter your API key"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label>Daily Quota Used</ion-label>
                <ion-badge slot="end" color="primary">{{apiSettings.quotaUsed}}/{{apiSettings.quotaLimit}}</ion-badge>
              </ion-item>
              <ion-progress-bar [value]="apiSettings.quotaUsed / apiSettings.quotaLimit"></ion-progress-bar>
              <ion-button expand="block" (click)="saveApiSettings()">Save API Settings</ion-button>
            </ion-card-content>
          </ion-card>

          <!-- Data Usage -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Data Usage</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Limit Mobile Data Usage</ion-label>
                <ion-toggle [(ngModel)]="dataSettings.limitMobileData" slot="end"></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-label>Download Quality on WiFi</ion-label>
                <ion-select [(ngModel)]="dataSettings.wifiQuality">
                  <ion-select-option value="high">High</ion-select-option>
                  <ion-select-option value="medium">Medium</ion-select-option>
                  <ion-select-option value="low">Low</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-label>Download Quality on Mobile</ion-label>
                <ion-select [(ngModel)]="dataSettings.mobileQuality">
                  <ion-select-option value="high">High</ion-select-option>
                  <ion-select-option value="medium">Medium</ion-select-option>
                  <ion-select-option value="low">Low</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Cache Management -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Cache Management</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Cache Size</ion-label>
                <ion-badge slot="end" color="secondary">{{cacheSize}}</ion-badge>
              </ion-item>
              <ion-item>
                <ion-label>Auto-clear Cache</ion-label>
                <ion-toggle [(ngModel)]="cacheSettings.autoClear" slot="end"></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Cache Limit</ion-label>
                <ion-range [(ngModel)]="cacheSettings.limit" min="100" max="5000" step="100" snaps="true">
                  <ion-label slot="start">100MB</ion-label>
                  <ion-label slot="end">5GB</ion-label>
                </ion-range>
                <ion-note>{{cacheSettings.limit}}MB</ion-note>
              </ion-item>
              <ion-button expand="block" color="warning" (click)="clearCache()">Clear Cache Now</ion-button>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-accordion>

    </ion-accordion-group>

    <!-- Account Actions -->
    <ion-list class="account-actions">
      <ion-item button class="logout-item" (click)="logout()">
        <ion-icon slot="start" name="log-out-outline" color="danger"></ion-icon>
        <ion-label color="danger">Logout</ion-label>
      </ion-item>
    </ion-list>

    <ion-button expand="block" fill="outline" color="danger" (click)="deleteAccount()" class="delete-account-button">
      Delete Account
    </ion-button>
  `,
  styles: [`
    .settings-accordion-group {
      margin-top: 16px;
    }

    ion-accordion {
      margin-bottom: 12px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      background: var(--ion-card-background);
      border: 1px solid var(--ion-card-border-color);
    }

    ion-accordion ion-item[slot="header"] {
      --background: var(--ion-card-background);
      --color: var(--ion-text-color);
      --padding-start: 20px;
      --inner-padding-end: 20px;
      --padding-top: 16px;
      --padding-bottom: 16px;
    }

    ion-accordion ion-item[slot="header"] ion-icon {
      color: var(--ion-color-primary);
      margin-right: 12px;
    }

    ion-accordion ion-item[slot="header"] h2 {
      font-size: 1.2em;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--ion-text-color);
    }

    ion-accordion ion-item[slot="header"] p {
      font-size: 0.9em;
      color: var(--ion-text-color-secondary);
      margin: 0;
    }

    .accordion-content {
      padding: 24px;
      background: var(--ion-card-background);
    }

    ion-card {
      margin-bottom: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      background: var(--ion-card-background);
      border: 1px solid var(--ion-card-border-color);
    }

    ion-card-header {
      padding: 20px 20px 12px 20px;
    }

    ion-card-content {
      padding: 0 20px 20px 20px;
    }

    ion-card-title {
      font-size: 1.1em;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    ion-item {
      --background: transparent;
      --border-color: var(--ion-item-border-color);
      --padding-start: 0;
      --inner-padding-end: 0;
      --padding-top: 12px;
      --padding-bottom: 12px;
    }

    ion-button {
      margin-top: 16px;
    }

    .account-actions {
      background: var(--ion-card-background);
      margin-top: 20px;
      border-radius: 12px;
      border: 1px solid var(--ion-card-border-color);
    }

    .logout-item {
      --padding-start: 20px;
      --inner-padding-end: 20px;
      --padding-top: 16px;
      --padding-bottom: 16px;
      --background: var(--ion-card-background);
    }

    .delete-account-button {
      margin-top: 24px;
      --border-width: 1px;
    }

    ion-progress-bar {
      margin-top: 12px;
      margin-bottom: 12px;
    }

    ion-range {
      margin-top: 12px;
    }

    ion-note {
      text-align: center;
      display: block;
      margin-top: 12px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class AccountContentComponent implements OnInit {
  // Profile data
  profileData = {
    displayName: 'John Doe',
    handle: '@johndoe',
    avatar: ''
  };

  // Password data
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Connected accounts
  connectedAccounts = [
    { name: 'YouTube', icon: 'logo-youtube', connected: true, status: 'Connected' },
    { name: 'Google', icon: 'logo-google', connected: true, status: 'Connected' },
    { name: 'Twitter', icon: 'logo-twitter', connected: false, status: 'Not connected' }
  ];

  // Content preferences
  contentPreferences = {
    videoQuality: 'auto',
    autoplay: true,
    autoplayMobile: false,
    captions: true,
    captionLanguage: 'en',
    region: 'international'
  };

  // Video quality options
  videoQualities = [
    { label: 'Auto (Recommended)', value: 'auto' },
    { label: '8K (4320p)', value: '4320p' },
    { label: '4K (2160p)', value: '2160p' },
    { label: 'QHD (1440p)', value: '1440p' },
    { label: 'Full HD (1080p)', value: '1080p' },
    { label: 'HD (720p)', value: '720p' },
    { label: 'SD (480p)', value: '480p' },
    { label: 'SD (360p)', value: '360p' },
    { label: 'LD (240p)', value: '240p' },
    { label: 'LD (144p)', value: '144p' }
  ];

  // API settings
  apiSettings = {
    apiKey: '',
    quotaUsed: 8500,
    quotaLimit: 10000
  };

  // Data settings
  dataSettings = {
    limitMobileData: true,
    wifiQuality: 'high',
    mobileQuality: 'medium'
  };

  // Cache settings
  cacheSettings = {
    autoClear: true,
    limit: 1000
  };

  cacheSize = '245 MB';

  constructor() {}

  ngOnInit() {}

  // Profile methods
  selectAvatar() {
    console.log('Select avatar');
  }

  saveProfile() {
    console.log('Save profile:', this.profileData);
  }

  // Password methods
  changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      console.log('Passwords do not match');
      return;
    }
    console.log('Change password');
  }

  // Connected accounts
  toggleConnection(account: any) {
    account.connected = !account.connected;
    account.status = account.connected ? 'Connected' : 'Not connected';
    console.log('Toggle connection for:', account.name);
  }

  // API methods
  saveApiSettings() {
    console.log('Save API settings:', this.apiSettings);
  }

  // Cache methods
  clearCache() {
    console.log('Clear cache');
    this.cacheSize = '0 MB';
  }

  // Account actions
  logout() {
    console.log('User logout initiated');
  }

  deleteAccount() {
    console.log('User delete account initiated');
  }
}
