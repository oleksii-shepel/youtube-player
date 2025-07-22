import { Authorization } from './../../services/authorization.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { IonicStorageModule, Storage } from '@ionic/storage-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Settings } from 'src/app/services/settings.service';
import { firstValueFrom } from '@actioncrew/streamix';

@Component({
  selector: 'app-settings',
  template: `
    <ion-content class="youtube-api-settings-content" [attr.data-theme]="appearanceSettings.theme">
      <div class="settings-container scrollable">
        <div class="user-header">
          <div class="user-avatar">
            <img [src]="userInfo.avatar" alt="User Avatar" />
            <div class="online-indicator" [class.connected]="isApiConnected"></div>
          </div>
          <div class="user-info">
            <h2>{{ userInfo.name || 'Not Connected' }}</h2>
            <p>{{ userInfo.channelId || 'YouTube Data API Settings' }}</p>
            <ion-chip
              [color]="isApiConnected ? 'success' : 'danger'"
              size="small"
            >
              <ion-icon
                [name]="isApiConnected ? 'checkmark-circle' : 'close-circle'"
                slot="start"
              ></ion-icon>
              {{ isApiConnected ? 'Connected' : 'Disconnected' }}
            </ion-chip>
          </div>
          <div class="back-button-container">
            <ion-button
              fill="outline"
              color="primary"
              (click)="goBackToApp()"
              class="back-button"
            >
              <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
              Back to App
            </ion-button>
          </div>
        </div>

        <div class="settings-nav scrollable">
          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'appearance'"
            (click)="selectMainSection('appearance')"
          >
            <ion-icon name="color-palette-outline"></ion-icon>
            <span>Appearance</span>
          </div>

          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'region-language'"
            (click)="selectMainSection('region-language')"
          >
            <ion-icon name="globe-outline"></ion-icon>
            <span>Region & Language</span>
          </div>

          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'playlists'"
            (click)="selectMainSection('playlists')"
          >
            <ion-icon name="list-outline"></ion-icon>
            <span>Playlists</span>
            <ion-badge color="primary">{{ playlistCount }}</ion-badge>
          </div>

          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'subscriptions'"
            (click)="selectMainSection('subscriptions')"
          >
            <ion-icon name="people-outline"></ion-icon>
            <span>Subscriptions</span>
            <ion-badge color="secondary">{{ subscriptionCount }}</ion-badge>
          </div>

          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'api-key'"
            (click)="selectMainSection('api-key')"
          >
            <ion-icon name="key-outline"></ion-icon>
            <span>API Configuration</span>
          </div>

          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'about'"
            (click)="selectMainSection('about')"
          >
            <ion-icon name="information-circle-outline"></ion-icon>
            <span>About</span>
          </div>
        </div>

        <div class="settings-main scrollable">
          <div class="settings-header">
            <h1>{{ getSectionTitle() }}</h1>
            <div class="header-actions">
              <ion-button
                fill="outline"
                size="small"
                (click)="refreshData()"
                [disabled]="!isApiConnected || isLoading"
              >
                <ion-icon
                  name="refresh-outline"
                  slot="start"
                  [class.rotating]="isLoading"
                ></ion-icon>
                Refresh
              </ion-button>
            </div>
          </div>

          <!-- User Information Section -->
          <div *ngIf="selectedMainSection === 'user-info'" class="content-section">
            <div class="section-card" *ngIf="isApiConnected">
              <div class="card-header">
                <h3>Channel Information</h3>
              </div>
              <div class="user-details">
                <div class="detail-row">
                  <ion-icon name="person-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Channel Name</span>
                    <span class="value">{{ userInfo.name || 'Loading...' }}</span>
                  </div>
                </div>
                <div class="detail-row">
                  <ion-icon name="mail-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Email</span>
                    <span class="value">{{ userInfo.email || 'Not available' }}</span>
                  </div>
                </div>
                <div class="detail-row">
                  <ion-icon name="tv-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Channel ID</span>
                    <span class="value">{{ userInfo.channelId || 'Loading...' }}</span>
                  </div>
                </div>
                <div class="detail-row">
                  <ion-icon name="people-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Subscribers</span>
                    <span class="value">{{ formatNumber(userInfo.subscriberCount) }}</span>
                  </div>
                </div>
                <div class="detail-row">
                  <ion-icon name="videocam-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Total Videos</span>
                    <span class="value">{{ formatNumber(userInfo.videoCount) }}</span>
                  </div>
                </div>
                <div class="detail-row">
                  <ion-icon name="eye-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Total Views</span>
                    <span class="value">{{ formatNumber(userInfo.totalViews) }}</span>
                  </div>
                </div>
                <div class="detail-row">
                  <ion-icon name="calendar-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Joined</span>
                    <span class="value">{{ userInfo.joinedDate || 'Not available' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="section-card" *ngIf="!isApiConnected">
              <div class="empty-state">
                <ion-icon name="cloud-offline-outline" size="large"></ion-icon>
                <p>Connect to YouTube API to view user information</p>
              </div>
            </div>
          </div>

          <!-- Appearance Section -->
          <div *ngIf="selectedMainSection === 'appearance'" class="content-section">
            <ion-list>
              <ion-item>
                <ion-icon name="color-palette-outline" slot="start"></ion-icon>
                <ion-label>Theme</ion-label>
                <ion-select
                  [(ngModel)]="appearanceSettings.theme"
                  (ionChange)="onThemeChange()"
                  interface="popover"
                >
                  <ion-select-option value="light">Light</ion-select-option>
                  <ion-select-option value="dark">Dark</ion-select-option>
                  <ion-select-option value="default">Default</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-icon name="brush-outline" slot="start"></ion-icon>
                <ion-label>Accent Color</ion-label>
                <input
                  type="color"
                  [(ngModel)]="appearanceSettings.accentColor"
                  (change)="saveAppearanceSettings()"
                  class="color-picker"
                >
              </ion-item>
              <ion-item>
                <ion-icon name="contract-outline" slot="start"></ion-icon>
                <ion-label>Compact Mode</ion-label>
                <ion-toggle
                  [(ngModel)]="appearanceSettings.compactMode"
                  (ionChange)="saveAppearanceSettings()"
                ></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-icon name="image-outline" slot="start"></ion-icon>
                <ion-label>Show Thumbnails</ion-label>
                <ion-toggle
                  [(ngModel)]="appearanceSettings.showThumbnails"
                  (ionChange)="saveAppearanceSettings()"
                ></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-icon name="play-outline" slot="start"></ion-icon>
                <ion-label>Auto-play Videos</ion-label>
                <ion-toggle
                  [(ngModel)]="appearanceSettings.autoplay"
                  (ionChange)="saveAppearanceSettings()"
                ></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-icon name="list-outline" slot="start"></ion-icon>
                <ion-label>Items per Page</ion-label>
                <ion-select
                  [(ngModel)]="appearanceSettings.itemsPerPage"
                  (ionChange)="saveAppearanceSettings()"
                >
                  <ion-select-option value="10">10</ion-select-option>
                  <ion-select-option value="25">25</ion-select-option>
                  <ion-select-option value="50">50</ion-select-option>
                  <ion-select-option value="100">100</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>
          </div>

          <!-- Region & Language Section -->
          <div *ngIf="selectedMainSection === 'region-language'" class="content-section">
            <ion-list>
              <ion-item>
                <ion-icon name="flag-outline" slot="start"></ion-icon>
                <ion-label>Country/Region</ion-label>
                <ion-select
                  [(ngModel)]="regionLanguageSettings.country"
                  (ionChange)="saveRegionLanguageSettings()"
                >
                  <ion-select-option value="US">United States</ion-select-option>
                  <ion-select-option value="GB">United Kingdom</ion-select-option>
                  <ion-select-option value="CA">Canada</ion-select-option>
                  <ion-select-option value="AU">Australia</ion-select-option>
                  <ion-select-option value="DE">Germany</ion-select-option>
                  <ion-select-option value="FR">France</ion-select-option>
                  <ion-select-option value="ES">Spain</ion-select-option>
                  <ion-select-option value="IT">Italy</ion-select-option>
                  <ion-select-option value="JP">Japan</ion-select-option>
                  <ion-select-option value="KR">South Korea</ion-select-option>
                  <ion-select-option value="IN">India</ion-select-option>
                  <ion-select-option value="BR">Brazil</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-icon name="language-outline" slot="start"></ion-icon>
                <ion-label>Language</ion-label>
                <ion-select
                  [(ngModel)]="regionLanguageSettings.language"
                  (ionChange)="saveRegionLanguageSettings()"
                >
                  <ion-select-option value="en">English</ion-select-option>
                  <ion-select-option value="es">Spanish</ion-select-option>
                  <ion-select-option value="fr">French</ion-select-option>
                  <ion-select-option value="de">German</ion-select-option>
                  <ion-select-option value="it">Italian</ion-select-option>
                  <ion-select-option value="pt">Portuguese</ion-select-option>
                  <ion-select-option value="ja">Japanese</ion-select-option>
                  <ion-select-option value="ko">Korean</ion-select-option>
                  <ion-select-option value="zh">Chinese</ion-select-option>
                  <ion-select-option value="hi">Hindi</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-icon name="time-outline" slot="start"></ion-icon>
                <ion-label>Timezone</ion-label>
                <ion-select
                  [(ngModel)]="regionLanguageSettings.timezone"
                  (ionChange)="saveRegionLanguageSettings()"
                >
                  <ion-select-option value="America/New_York">Eastern Time</ion-select-option>
                  <ion-select-option value="America/Chicago">Central Time</ion-select-option>
                  <ion-select-option value="America/Denver">Mountain Time</ion-select-option>
                  <ion-select-option value="America/Los_Angeles">Pacific Time</ion-select-option>
                  <ion-select-option value="Europe/London">London</ion-select-option>
                  <ion-select-option value="Europe/Paris">Paris</ion-select-option>
                  <ion-select-option value="Europe/Berlin">Berlin</ion-select-option>
                  <ion-select-option value="Asia/Tokyo">Tokyo</ion-select-option>
                  <ion-select-option value="Asia/Seoul">Seoul</ion-select-option>
                  <ion-select-option value="Asia/Kolkata">Mumbai</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-icon name="calendar-outline" slot="start"></ion-icon>
                <ion-label>Date Format</ion-label>
                <ion-select
                  [(ngModel)]="regionLanguageSettings.dateFormat"
                  (ionChange)="saveRegionLanguageSettings()"
                >
                  <ion-select-option value="MM/dd/yyyy">MM/DD/YYYY</ion-select-option>
                  <ion-select-option value="dd/MM/yyyy">DD/MM/YYYY</ion-select-option>
                  <ion-select-option value="yyyy-MM-dd">YYYY-MM-DD</ion-select-option>
                  <ion-select-option value="dd.MM.yyyy">DD.MM.YYYY</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-icon name="time-outline" slot="start"></ion-icon>
                <ion-label>Time Format</ion-label>
                <ion-select
                  [(ngModel)]="regionLanguageSettings.timeFormat"
                  (ionChange)="saveRegionLanguageSettings()"
                >
                  <ion-select-option value="12h">12 Hour</ion-select-option>
                  <ion-select-option value="24h">24 Hour</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>
          </div>

          <!-- Playlists Section -->
          <div *ngIf="selectedMainSection === 'playlists'" class="content-section">
            <div class="section-card" *ngIf="isApiConnected">
              <div class="card-header">
                <h3>Your Playlists</h3>
                <ion-button size="small" fill="outline" (click)="createPlaylist()">
                  <ion-icon name="add-outline" slot="start"></ion-icon>
                  Create New
                </ion-button>
              </div>
              <div class="playlist-list">
                <div class="playlist-item" *ngFor="let playlist of playlists">
                  <div class="playlist-thumbnail">
                    <img [src]="playlist.thumbnail" alt="Playlist thumbnail">
                    <div class="video-count">{{ playlist.videoCount }}</div>
                  </div>
                  <div class="playlist-info">
                    <h4>{{ playlist.name }}</h4>
                    <p>{{ playlist.description || 'No description' }}</p>
                    <div class="playlist-meta">
                      <ion-chip [color]="getPrivacyColor(playlist.privacy)" size="small">
                        {{ playlist.privacy }}
                      </ion-chip>
                      <span class="created-date">{{ playlist.createdDate }}</span>
                    </div>
                  </div>
                  <div class="playlist-actions">
                    <ion-button fill="clear" size="small" (click)="editPlaylist(playlist)">
                      <ion-icon name="create-outline"></ion-icon>
                    </ion-button>
                    <ion-button fill="clear" size="small" color="danger" (click)="deletePlaylist(playlist)">
                      <ion-icon name="trash-outline"></ion-icon>
                    </ion-button>
                  </div>
                </div>
              </div>
            </div>
            <div class="section-card" *ngIf="!isApiConnected">
              <div class="empty-state">
                <ion-icon name="list-outline" size="large"></ion-icon>
                <p>Connect to YouTube API to manage playlists</p>
              </div>
            </div>
          </div>

          <!-- Subscriptions Section -->
          <div *ngIf="selectedMainSection === 'subscriptions'" class="content-section">
            <div class="section-card" *ngIf="isApiConnected">
              <div class="card-header">
                <h3>Your Subscriptions</h3>
                <ion-searchbar
                  [(ngModel)]="subscriptionFilter"
                  (ionInput)="filterSubscriptions()"
                  placeholder="Search subscriptions..."
                ></ion-searchbar>
              </div>
              <div class="subscription-list">
                <div class="subscription-item" *ngFor="let subscription of filteredSubscriptions">
                  <div class="subscription-avatar">
                    <img [src]="subscription.thumbnail" alt="Channel avatar">
                  </div>
                  <div class="subscription-info">
                    <h4>{{ subscription.name }}</h4>
                    <p>{{ formatNumber(subscription.subscriberCount) }} subscribers</p>
                    <ion-chip size="small" color="tertiary">{{ subscription.category }}</ion-chip>
                  </div>
                  <div class="subscription-actions">
                    <ion-button fill="clear" size="small" (click)="viewChannel(subscription)">
                      <ion-icon name="open-outline"></ion-icon>
                    </ion-button>
                    <ion-button fill="clear" size="small" color="danger" (click)="unsubscribe(subscription)">
                      <ion-icon name="person-remove-outline"></ion-icon>
                    </ion-button>
                  </div>
                </div>
              </div>
            </div>
            <div class="section-card" *ngIf="!isApiConnected">
              <div class="empty-state">
                <ion-icon name="people-outline" size="large"></ion-icon>
                <p>Connect to YouTube API to view subscriptions</p>
              </div>
            </div>
          </div>

          <!-- API Configuration Section -->
          <div *ngIf="selectedMainSection === 'api-key'" class="content-section">
            <div class="section-card">
              <ion-list>
                <ion-item>
                  <ion-icon name="key-outline" slot="start"></ion-icon>
                  <ion-input
                    label="YouTube API Key"
                    labelPlacement="stacked"
                    [(ngModel)]="apiConfig.apiKey"
                    [type]="showApiKey ? 'text' : 'password'"
                    placeholder="Enter your YouTube Data API key"
                  ></ion-input>
                  <ion-button
                    fill="clear"
                    slot="end"
                    (click)="toggleApiKeyVisibility()"
                  >
                    <ion-icon [name]="showApiKey ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                  </ion-button>
                </ion-item>
                <ion-item>
                  <ion-icon name="person-circle-outline" slot="start"></ion-icon>
                  <ion-input
                    label="Client ID (Optional)"
                    labelPlacement="stacked"
                    [(ngModel)]="apiConfig.clientId"
                    placeholder="OAuth 2.0 Client ID"
                  ></ion-input>
                </ion-item>
                <ion-item>
                  <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
                  <ion-input
                    label="Client Secret (Optional)"
                    labelPlacement="stacked"
                    [(ngModel)]="apiConfig.clientSecret"
                    [type]="showClientSecret ? 'text' : 'password'"
                    placeholder="OAuth 2.0 Client Secret"
                  ></ion-input>
                  <ion-button
                    fill="clear"
                    slot="end"
                    (click)="toggleClientSecretVisibility()"
                  >
                    <ion-icon [name]="showClientSecret ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                  </ion-button>
                </ion-item>
              </ion-list>
            </div>

            <div class="section-card">
              <div class="card-header">
                <h3>Quota Usage</h3>
              </div>
              <div class="quota-info">
                <div class="quota-bar">
                  <div class="quota-progress" [style.width.%]="getQuotaPercentage()"></div>
                </div>
                <div class="quota-text">
                  <span>{{ formatNumber(apiConfig.quotaUsage) }} / {{ formatNumber(apiConfig.quotaLimit) }} </span>
                  <span>({{ getQuotaPercentage() }}% used)</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Add About Section -->
        <div *ngIf="selectedMainSection === 'about'" class="content-section">
          <div class="section-card">
            <div class="card-header">
              <h3>About This App</h3>
            </div>
            <div class="about-content">
              <div class="app-info">
                <img src="assets/icons/icon-512x512.png" alt="App Logo" class="app-logo">
                <h4>YouTube API Manager</h4>
                <p>Version {{ appVersion }}</p>
              </div>

              <div class="about-details">
                <p>A powerful tool for managing your YouTube channel through the YouTube Data API.</p>

                <div class="detail-row">
                  <ion-icon name="code-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Developed By</span>
                    <span class="value">{{ developerInfo }}</span>
                  </div>
                </div>

                <div class="detail-row">
                  <ion-icon name="calendar-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">Release Date</span>
                    <span class="value">{{ releaseDate }}</span>
                  </div>
                </div>

                <div class="detail-row">
                  <ion-icon name="document-text-outline"></ion-icon>
                  <div class="detail-content">
                    <span class="label">License</span>
                    <span class="value">{{ licenseInfo }}</span>
                  </div>
                </div>

                <div class="action-buttons">
                  <ion-button expand="block" fill="outline" (click)="openWebsite()">
                    <ion-icon name="globe-outline" slot="start"></ion-icon>
                    Visit Website
                  </ion-button>
                  <ion-button expand="block" fill="outline" (click)="openPrivacyPolicy()">
                    <ion-icon name="shield-checkmark-outline" slot="start"></ion-icon>
                    Privacy Policy
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!selectedMainSection" class="empty-state">
          <ion-icon name="settings-outline" size="large"></ion-icon>
          <p class="empty-state-message">
            Select a category from the left menu to view YouTube API settings.
          </p>
        </div>
      </div>
    </div>
  </ion-content>
  `,
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  providers: [
    Storage
  ],
  imports: [
    CommonModule, FormsModule, IonicModule, IonicStorageModule
]
})
export class SettingsComponent implements OnInit {
  selectedMainSection: string = 'appearance';
  isApiConnected: boolean = false;
  isLoading: boolean = false;
  showApiKey: boolean = false;
  showClientSecret: boolean = false;
  subscriptionFilter: string = '';
  filteredSubscriptions: any[] = [];

  appVersion = '1.0.0';
  releaseDate = '2023-11-15';
  developerInfo = 'Tech Solutions Inc.';
  licenseInfo = 'MIT License';

  // User Information
  userInfo = {
    name: '',
    channelId: '',
    avatar: this.getDefaultAvatarUrl('Y'),
    email: '',
    subscriberCount: 0,
    videoCount: 0,
    totalViews: 0,
    joinedDate: '',
    description: ''
  };

  // Appearance Settings
  appearanceSettings = {
    theme: 'default',
    accentColor: '#ff0000',
    compactMode: false,
    showThumbnails: true,
    itemsPerPage: 25,
    autoplay: true
  };

  // Region & Language Settings
  regionLanguageSettings = {
    country: 'US',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    numberFormat: 'en-US'
  };

  // Playlists Data
  playlists = [
    {
      id: 'PL1',
      name: 'JavaScript Tutorials',
      description: 'Complete JavaScript programming course',
      videoCount: 25,
      privacy: 'public',
      thumbnail: 'assets/playlist-1.jpg',
      createdDate: 'Mar 2023'
    },
    {
      id: 'PL2',
      name: 'React Development',
      description: 'Modern React development techniques',
      videoCount: 18,
      privacy: 'public',
      thumbnail: 'assets/playlist-2.jpg',
      createdDate: 'Jun 2023'
    },
    {
      id: 'PL3',
      name: 'Personal Projects',
      description: 'My coding side projects',
      videoCount: 8,
      privacy: 'private',
      thumbnail: 'assets/playlist-3.jpg',
      createdDate: 'Aug 2023'
    }
  ];
  playlistCount: number = 3;

  // Subscriptions Data
  subscriptions = [
    {
      id: 'UC1',
      name: 'Tech Channel Pro',
      subscriberCount: 2100000,
      category: 'Technology',
      thumbnail: 'assets/channel-1.jpg'
    },
    {
      id: 'UC2',
      name: 'Code Academy',
      subscriberCount: 5800000,
      category: 'Education',
      thumbnail: 'assets/channel-2.jpg'
    },
    {
      id: 'UC3',
      name: 'Dev Talk',
      subscriberCount: 987000,
      category: 'Technology',
      thumbnail: 'assets/channel-3.jpg'
    }
  ];
  subscriptionCount: number = 3;

  // API Configuration
  apiConfig = {
    apiKey: '',
    clientId: '',
    clientSecret: '',
    quotaUsage: 2500,
    quotaLimit: 10000,
    rateLimitEnabled: true,
    cacheEnabled: true,
    cacheDuration: 3600
  };

  constructor(private router: Router, private storage: Storage, private settings: Settings, private authorization: Authorization) {
    this.filteredSubscriptions = [...this.subscriptions];
  }

  async ngOnInit() {
    await this.storage.create();
    await this.loadSavedSettings();
    this.applyTheme();
    await this.checkApiConnection();
    this.loadUserProfile();
  }

  // Load user profile from Authorization service
  loadUserProfile() {
    const profile = this.authorization.getProfile();
    if (profile) {
      this.userInfo = {
        ...this.userInfo,
        name: profile.name,
        email: profile.email,
        avatar: profile.picture || this.getDefaultAvatarUrl(profile.name)
      };
    }
  }

  async checkApiConnection() {
    // First check if we have OAuth access
    if (this.authorization.isSignedIn()) {
      this.isApiConnected = true;
      return;
    }

    // Fall back to API key check
    if (!this.apiConfig.apiKey) {
      this.isApiConnected = false;
      return;
    }

    this.isLoading = true;

    try {
      this.isApiConnected = true;
      await this.loadUserData();
    } catch (error) {
      console.error('API Connection Error:', error);
      this.isApiConnected = false;
    } finally {
      this.isLoading = false;
    }
  }

  // Updated loadUserData to combine Authorization profile with YouTube API data
  async loadUserData() {
    this.isLoading = true;
    try {
      // Get profile from Authorization service if available
      const authProfile = this.authorization.getProfile();
      if (authProfile) {
        this.userInfo = {
          ...this.userInfo,
          name: authProfile.name,
          email: authProfile.email,
          avatar: authProfile.picture || this.getDefaultAvatarUrl(authProfile.name)
        };
      }

      // Only fetch YouTube-specific data if we have an API connection
      if (this.isApiConnected) {
        const channelResponse = await firstValueFrom(this.settings.getMyChannel());
        const channel = channelResponse.items[0];

        this.userInfo = {
          ...this.userInfo,
          channelId: channel.id,
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount),
          totalViews: parseInt(channel.statistics.viewCount),
          joinedDate: new Date(channel.snippet.publishedAt).toLocaleDateString(),
          description: channel.snippet.description
        };

        await this.loadPlaylists();
        await this.loadSubscriptions();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getDefaultAvatarUrl(name: string): string {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100" height="100" fill="#555"/>
        <text x="50%" y="55%" font-size="40" text-anchor="middle" fill="#fff" font-family="Arial" dy=".3em">${initials}</text>
      </svg>
    `;

    const encoded = btoa(
      encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );

    return `data:image/svg+xml;base64,${encoded}`;
  }

  // Updated loadPlaylists to use Settings service
  async loadPlaylists() {
    if (!this.isApiConnected) return;

    try {
      const playlistsResponse = await firstValueFrom(this.settings.listPlaylists());
      this.playlists = playlistsResponse.items.map((item: any) => ({
        id: item.id,
        name: item.snippet.title,
        description: item.snippet.description,
        videoCount: 0, // Would need another API call to get this
        privacy: item.status.privacyStatus,
        thumbnail: item.snippet.thumbnails?.default?.url || 'assets/playlist-default.jpg',
        createdDate: new Date(item.snippet.publishedAt).toLocaleDateString()
      }));
      this.playlistCount = this.playlists.length;
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  }

  // Updated loadSubscriptions to use Settings service
  async loadSubscriptions() {
    if (!this.isApiConnected) return;

    try {
      const subscriptionsResponse = await firstValueFrom(this.settings.listSubscriptions());
      this.subscriptions = subscriptionsResponse.items.map((item: any) => ({
        id: item.snippet.resourceId.channelId,
        name: item.snippet.title,
        subscriberCount: 0, // Would need another API call to get this
        category: '', // Not directly available in subscription response
        thumbnail: item.snippet.thumbnails?.default?.url || 'assets/channel-default.jpg'
      }));
      this.subscriptionCount = this.subscriptions.length;
      this.filteredSubscriptions = [...this.subscriptions];
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  }

  // Updated createPlaylist to use Settings service
  async createPlaylist() {
    if (!this.isApiConnected) return;

    try {
      // In a real app, you'd get these values from a form
      const title = 'New Playlist';
      const description = 'Playlist created from the app';
      const privacyStatus = 'private';

      const response = await firstValueFrom(
        this.settings.createPlaylist(title, description, privacyStatus)
      );

      // Add the new playlist to our list
      this.playlists.unshift({
        id: response.id,
        name: response.snippet.title,
        description: response.snippet.description,
        videoCount: 0,
        privacy: response.status.privacyStatus,
        thumbnail: response.snippet.thumbnails?.default?.url || 'assets/playlist-default.jpg',
        createdDate: new Date(response.snippet.publishedAt).toLocaleDateString()
      });
      this.playlistCount = this.playlists.length;
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  }

  // Updated deletePlaylist to use Settings service
  async deletePlaylist(playlist: any) {
    try {
      await firstValueFrom(this.settings.deletePlaylist(playlist.id));
      this.playlists = this.playlists.filter(p => p.id !== playlist.id);
      this.playlistCount = this.playlists.length;
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  }

  // Updated unsubscribe to use Settings service
  async unsubscribe(channel: any) {
    try {
      // Note: This assumes the subscriptionId is the same as channelId
      // In a real app, you'd need to find the actual subscriptionId
      await firstValueFrom(this.settings.unsubscribe(channel.id));
      this.subscriptions = this.subscriptions.filter(s => s.id !== channel.id);
      this.subscriptionCount = this.subscriptions.length;
      this.filterSubscriptions();
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }

  async loadSavedSettings() {
    // Load API config
    const savedApiConfig = await this.storage.get('youtubeApiConfig');
    if (savedApiConfig) {
      this.apiConfig = { ...this.apiConfig, ...savedApiConfig };
    }

    // Load appearance settings
    const savedAppearance = await this.storage.get('appearanceSettings');
    if (savedAppearance) {
      this.appearanceSettings = { ...this.appearanceSettings, ...savedAppearance };
    }

    // Load region/language settings
    const savedRegionLanguage = await this.storage.get('regionLanguageSettings');
    if (savedRegionLanguage) {
      this.regionLanguageSettings = { ...this.regionLanguageSettings, ...savedRegionLanguage };
    }
  }

  selectMainSection(section: string) {
    this.selectedMainSection = section;

    // Optional: Save the last viewed section to storage
    this.storage.set('lastViewedSection', section).catch(err => {
      console.error('Error saving last viewed section:', err);
    });

    // Optional: Scroll to top when changing sections
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(300);
    }
  }

  getSectionTitle(): string {
    const sectionTitles: {[key: string]: string} = {
      'appearance': 'Theme Settings',
      'region-language': 'Region & Language',
      'playlists': 'Playlists Management',
      'subscriptions': 'Subscriptions',
      'api-key': 'API Configuration',
      'about': 'About'
    };

    return sectionTitles[this.selectedMainSection] || 'YouTube Data API Settings';
  }

  applyTheme() {
    document.body.setAttribute('data-theme', this.appearanceSettings.theme);
  }

  onThemeChange() {
    this.applyTheme();
    this.saveAppearanceSettings();
  }

  async saveAppearanceSettings() {
    await this.storage.set('appearanceSettings', this.appearanceSettings);
  }

  async saveRegionLanguageSettings() {
    await this.storage.set('regionLanguageSettings', this.regionLanguageSettings);
  }

  async saveApiConfig() {
    await this.storage.set('youtubeApiConfig', this.apiConfig);
    this.checkApiConnection();
  }

  async resetApiConfig() {
    this.apiConfig = {
      apiKey: '',
      clientId: '',
      clientSecret: '',
      quotaUsage: 0,
      quotaLimit: 10000,
      rateLimitEnabled: true,
      cacheEnabled: true,
      cacheDuration: 3600
    };
    await this.storage.remove('youtubeApiConfig');
    this.isApiConnected = false;
  }

  async testApiConnection() {
    if (!this.apiConfig.apiKey) {
      this.isApiConnected = false;
      return;
    }

    this.isLoading = true;

    try {
      // In a real app, you would make an actual API call here
      // For demo purposes, we'll simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.isApiConnected = true;
      await this.loadUserData();
    } catch (error) {
      console.error('API Connection Error:', error);
      this.isApiConnected = false;
    } finally {
      this.isLoading = false;
    }
  }

  filterSubscriptions() {
    if (!this.subscriptionFilter) {
      this.filteredSubscriptions = [...this.subscriptions];
      return;
    }

    const filter = this.subscriptionFilter.toLowerCase();
    this.filteredSubscriptions = this.subscriptions.filter(sub =>
      sub.name.toLowerCase().includes(filter) ||
      sub.category.toLowerCase().includes(filter)
    );
  }

  refreshData() {
    if (!this.isApiConnected) return;

    this.isLoading = true;
    this.loadUserData().finally(() => {
      this.isLoading = false;
    });
  }

  toggleApiKeyVisibility() {
    this.showApiKey = !this.showApiKey;
  }

  toggleClientSecretVisibility() {
    this.showClientSecret = !this.showClientSecret;
  }

  getPrivacyColor(privacy: string): string {
    switch (privacy) {
      case 'public': return 'success';
      case 'private': return 'danger';
      case 'unlisted': return 'warning';
      default: return 'medium';
    }
  }

  formatNumber(num: number): string {
    return num.toLocaleString(this.regionLanguageSettings.numberFormat);
  }

  getQuotaPercentage(): number {
    return Math.round((this.apiConfig.quotaUsage / this.apiConfig.quotaLimit) * 100);
  }

  editPlaylist(playlist: any) {
    // In a real app, implement playlist editing logic
    console.log('Edit playlist:', playlist);
  }

  viewChannel(channel: any) {
    // In a real app, implement channel viewing logic
    console.log('View channel:', channel);
  }

  goBackToApp() {
    this.router.navigate(['/app']);
  }

  openWebsite() {
    // Implement website opening logic
    window.open('https://yourwebsite.com', '_blank');
  }

  openPrivacyPolicy() {
    // Implement privacy policy opening logic
    window.open('https://yourwebsite.com/privacy', '_blank');
  }
}
