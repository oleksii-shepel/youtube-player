import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Authorization } from 'src/app/services/authorization.service';

@Component({
  selector: 'app-settings',
  template: `
    <ion-content class="settings-content">
      <div class="settings-container scrollable">
        <!-- Header with user info -->
        <div class="user-header">
          <div class="user-avatar">
            <img [src]="userAvatar" alt="User Avatar" />
          </div>
          <div class="user-info">
            <h2>{{ userName }}</h2>
            <p>{{ userHandle }}</p>
          </div>
        </div>

        <!-- Navigation Menu -->
        <div class="settings-nav">
          <div class="nav-item active" (click)="navigateToSection('account')">
            <ion-icon name="home-outline"></ion-icon>
            <span>Home</span>
          </div>
          <div class="nav-item" (click)="navigateToSection('shorts')">
            <ion-icon name="play-outline"></ion-icon>
            <span>Shorts</span>
          </div>
          <div class="nav-item" (click)="navigateToSection('subscriptions')">
            <ion-icon name="bookmarks-outline"></ion-icon>
            <span>Subscriptions</span>
          </div>
          <div class="nav-item" (click)="navigateToSection('library')">
            <ion-icon name="play-circle-outline"></ion-icon>
            <span>Library</span>
          </div>
          <div class="nav-item" (click)="navigateToSection('history')">
            <ion-icon name="time-outline"></ion-icon>
            <span>History</span>
          </div>
        </div>

        <!-- Main Settings Content -->
        <div class="settings-main">
          <div class="settings-header">
            <h1>Account</h1>
          </div>

          <!-- General Section -->
          <div class="settings-section">
            <h3>General</h3>

            <div class="settings-group">
              <div class="setting-item" (click)="manageAccount()">
                <div class="setting-icon">
                  <ion-icon name="person-outline"></ion-icon>
                </div>
                <div class="setting-content">
                  <h4>Account</h4>
                  <p>Manage your account</p>
                </div>
              </div>

              <div class="setting-item" (click)="manageSubscriptions()">
                <div class="setting-icon">
                  <ion-icon name="bookmarks-outline"></ion-icon>
                </div>
                <div class="setting-content">
                  <h4>Subscriptions</h4>
                  <p>Manage your subscriptions</p>
                </div>
              </div>

              <div class="setting-item" (click)="managePlaylists()">
                <div class="setting-icon">
                  <ion-icon name="list-outline"></ion-icon>
                </div>
                <div class="setting-content">
                  <h4>Playlists</h4>
                  <p>Manage your playlists</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Preferences Section -->
          <div class="settings-section">
            <h3>Preferences</h3>

            <div class="settings-group">
              <div class="setting-item" (click)="openPreferences()">
                <div class="setting-icon">
                  <ion-icon name="settings-outline"></ion-icon>
                </div>
                <div class="setting-content">
                  <h4>Preferences</h4>
                  <p>Manage your preferences</p>
                </div>
              </div>

              <div class="setting-item" (click)="openAppSettings()">
                <div class="setting-icon">
                  <ion-icon name="settings-outline"></ion-icon>
                </div>
                <div class="setting-content">
                  <h4>App Settings</h4>
                  <p>Manage your app settings</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Back to App Button -->
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
      </div>
    </ion-content>
  `,
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SettingsPage {
  userName: string = 'Sophia Carter';
  userHandle: string = '@sophia.carter';
  userAvatar: string = 'assets/default-avatar.png';

  constructor(
    private router: Router,
    private authorization: Authorization
  ) {
    // Get user info from auth service if available
    this.authorization.authSubject.subscribe(auth => {
      if (auth) {
        this.userName = auth.profile.name || 'User';
        this.userHandle = auth.profile.email || '@user';
        this.userAvatar = auth.profile.picture || 'assets/default-avatar.png';
      }
    });
  }

  navigateToSection(section: string) {
    // Handle navigation to different sections
    console.log('Navigate to:', section);
    // You can implement actual navigation logic here
  }

  manageAccount() {
    // Navigate to account management
    console.log('Manage account');
  }

  manageSubscriptions() {
    // Navigate to subscriptions management
    console.log('Manage subscriptions');
  }

  managePlaylists() {
    // Navigate to playlists management
    console.log('Manage playlists');
  }

  openPreferences() {
    // Open preferences panel
    console.log('Open preferences');
  }

  openAppSettings() {
    // Open app settings panel
    console.log('Open app settings');
  }

  goBackToApp() {
    this.router.navigate(['/app']);
  }
}
