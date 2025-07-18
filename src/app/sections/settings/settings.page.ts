// src/app/settings/settings.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Authorization } from 'src/app/services/authorization.service';
import { AccountContentComponent } from 'src/app/pages/account/account.page';
import { AppearanceContentComponent } from 'src/app/pages/appearance/appearance.page';
import { ActivityContentComponent } from 'src/app/pages/activity/activity.page';
import { RegionalSettingsComponent } from 'src/app/pages/language/language.page';

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

        <div class="settings-nav scrollable">
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
            [class.active]="selectedMainSection === 'appearance'"
            (click)="selectMainSection('appearance')"
          >
            <ion-icon name="settings-outline"></ion-icon>
            <span>Appearance</span>
          </div>

          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'activity'"
            (click)="selectMainSection('activity')"
          >
            <ion-icon name="bookmarks-outline"></ion-icon>
            <span>User Data & Activity</span>
          </div>

          <div
            class="nav-item"
            [class.active]="selectedMainSection === 'language'"
            (click)="selectMainSection('language')"
          >
            <ion-icon name="bookmarks-outline"></ion-icon>
            <span>Region & Language</span>
          </div>
        </div>

        <div class="settings-main">
          <div class="settings-header">
            <h1>{{ getSectionTitle() }}</h1>
          </div>

          <div [ngSwitch]="selectedMainSection">
            <app-account-content *ngSwitchCase="'account'"></app-account-content>
            <app-appearance-content *ngSwitchCase="'appearance'"></app-appearance-content>
            <app-activity-content *ngSwitchCase="'activity'"></app-activity-content>
            <app-regional-content *ngSwitchCase="'language'"></app-regional-content>

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
    AppearanceContentComponent,
    ActivityContentComponent,
    RegionalSettingsComponent
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
      case 'account': return 'Account Settings';
      case 'appearance': return 'Appearance';
      case 'activity': return 'User Data & Activity';
      case 'language': return 'Regional Settings & Language';
      default: return 'Settings';
    }
  }

  goBackToApp() {
    this.router.navigate(['/app']);
  }
}
