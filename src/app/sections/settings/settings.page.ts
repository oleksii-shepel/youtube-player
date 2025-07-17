// src/app/settings/settings.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Authorization } from 'src/app/services/authorization.service';
import { AccountContentComponent } from 'src/app/pages/account/account.page';
import { PreferencesContentComponent } from 'src/app/pages/preferences/preferences.page';
import { AppSettingsContentComponent } from 'src/app/pages/settings/settings.page';
import { ShortsContentComponent } from 'src/app/pages/shorts/shorts.page';
import { SubscriptionsContentComponent } from 'src/app/pages/subscriptions/subscriptions.page';
import { LibraryContentComponent } from 'src/app/pages/library/library.page';
import { HistoryContentComponent } from 'src/app/pages/history/history.page';

@Component({
  selector: 'app-settings',
  template: `
    <ion-content class="settings-content">
      <div class="settings-container scrollable">
        <div class="user-header">
          <div class="user-avatar">
            <img [src]="userAvatar" alt="User Avatar" />
          </div>
          <div class="user-info">
            <h2>{{ userName }}</h2>
            <p>{{ userHandle }}</p>
          </div>
        </div>

        <div class="settings-nav">
          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'account'"
            (click)="selectMainSection('account')"
          >
            <ion-icon name="person-outline"></ion-icon>
            <span>Account</span>
          </div>
          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'preferences'"
            (click)="selectMainSection('preferences')"
          >
            <ion-icon name="settings-outline"></ion-icon>
            <span>Preferences</span>
          </div>
          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'app-settings'"
            (click)="selectMainSection('app-settings')"
          >
            <ion-icon name="apps-outline"></ion-icon>
            <span>App Settings</span>
          </div>

          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'subscriptions'"
            (click)="selectMainSection('subscriptions')"
          >
            <ion-icon name="bookmarks-outline"></ion-icon>
            <span>Subscriptions</span>
          </div>
          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'library'"
            (click)="selectMainSection('library')"
          >
            <ion-icon name="play-circle-outline"></ion-icon>
            <span>Library</span>
          </div>
          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'history'"
            (click)="selectMainSection('history')"
          >
            <ion-icon name="time-outline"></ion-icon>
            <span>History</span>
          </div>
          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'shorts'"
            (click)="selectMainSection('shorts')"
          >
            <ion-icon name="play-outline"></ion-icon>
            <span>Shorts</span>
          </div>

          </div>

        <div class="settings-main">
          <div class="settings-header">
            <h1>{{ getSectionTitle() }}</h1>
          </div>

          <div [ngSwitch]="selectedMainSection">
            <app-account-content *ngSwitchCase="'account'"></app-account-content>
            <app-preferences-content *ngSwitchCase="'preferences'"></app-preferences-content>
            <app-app-settings-content *ngSwitchCase="'app-settings'"></app-app-settings-content>
            <app-shorts-content *ngSwitchCase="'shorts'"></app-shorts-content>
            <app-subscriptions-content *ngSwitchCase="'subscriptions'"></app-subscriptions-content>
            <app-library-content *ngSwitchCase="'library'"></app-library-content>
            <app-history-content *ngSwitchCase="'history'"></app-history-content>

            <div *ngSwitchDefault>
              <p class="empty-state-message">Select a category from the left menu to view its settings.</p>
            </div>
          </div>
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
    </ion-content>
  `,
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    AccountContentComponent,
    PreferencesContentComponent,
    AppSettingsContentComponent,
    ShortsContentComponent,
    SubscriptionsContentComponent,
    LibraryContentComponent,
    HistoryContentComponent
  ]
})
export class SettingsPage implements OnInit {
  userName: string = 'Sophia Carter';
  userHandle: string = '@sophia.carter';
  userAvatar: string = 'assets/default-avatar.png';

  selectedMainSection: string = 'account'; // New: Holds the currently selected section

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

  ngOnInit() {
    // Optionally, set a default section on component load
    this.selectedMainSection = 'account';
  }

  // New method to select a main section
  selectMainSection(section: string) {
    this.selectedMainSection = section;
    console.log('Selected main section:', section);
    // You might also want to scroll to top of content here
  }

  getSectionTitle(): string {
    // Helper to get a human-readable title for the current section
    switch (this.selectedMainSection) {
      case 'account': return 'Account Management';
      case 'preferences': return 'App Preferences';
      case 'app-settings': return 'Application Settings';
      case 'shorts': return 'Shorts Settings';
      case 'subscriptions': return 'Your Subscriptions';
      case 'library': return 'Media Library';
      case 'history': return 'Viewing History';
      default: return 'Settings';
    }
  }

  goBackToApp() {
    this.router.navigate(['/app']);
  }
}
