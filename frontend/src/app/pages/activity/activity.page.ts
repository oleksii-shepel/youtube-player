import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface SettingsItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'button' | 'toggle' | 'info';
  value?: any;
  action?: (value?: any) => void; // Updated to allow optional parameter for toggles
  lines?: 'full' | 'none';
}

interface SettingsSection {
  header: string;
  items: SettingsItem[];
}

@Component({
  selector: 'app-activity-content',
  template: `
    <div *ngFor="let section of settingsSections">
      <ion-list lines="none" class="settings-list">
        <ion-list-header>
          <ion-label color="tertiary">{{ section.header }}</ion-label>
        </ion-list-header>

        <ion-item
          *ngFor="let item of section.items"
          [lines]="item.lines || 'none'"
          [button]="item.type === 'button'"
          (click)="item.type === 'button' && item.action && item.action()">

          <ion-icon slot="start" [name]="item.icon"></ion-icon>
          <ion-label>
            <h2>{{ item.title }}</h2>
            <p>{{ item.description }}</p>
          </ion-label>

          <ion-toggle
            *ngIf="item.type === 'toggle'"
            slot="end"
            [(ngModel)]="item.value"
            (ionChange)="item.action && item.action(item.value)">
          </ion-toggle>
        </ion-item>
      </ion-list>
    </div>
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
export class ActivityContentComponent implements OnInit {
  // Model properties for settings values
  receiveAllSubscriptionNotifications: boolean = true;
  pauseViewingHistory: boolean = false;
  pauseSearchHistory: boolean = false;

  settingsSections: SettingsSection[] = [];

  constructor() {}

  ngOnInit() {
    this.initializeSettingsSections();
    this.loadSettings();
  }

  private initializeSettingsSections() {
    this.settingsSections = [
      {
        header: 'Your Subscriptions',
        items: [
          {
            id: 'manage-subscriptions',
            icon: 'list-outline',
            title: 'Manage Subscriptions',
            description: 'View and organize all your subscribed channels.',
            type: 'button',
            action: () => this.manageAllSubscriptions(),
            lines: 'none' // Changed to none as it's the last item in this logical group
          },
          {
            id: 'subscription-notifications',
            icon: 'bell-outline',
            title: 'Receive All Notifications',
            description: 'Get notified for every new upload from subscribed channels.',
            type: 'toggle',
            value: this.receiveAllSubscriptionNotifications,
            action: (value: boolean) => this.updateReceiveAllSubscriptionNotifications(value),
            lines: 'full' // Marks the end of the section group
          }
        ]
      },
      {
        header: 'Library & Playlists',
        items: [
          {
            id: 'my-playlists',
            icon: 'albums-outline',
            title: 'My Playlists',
            description: 'Manage your created and saved playlists.',
            type: 'button',
            action: () => this.openMyPlaylists()
          },
          {
            id: 'watch-later',
            icon: 'time-outline',
            title: 'Watch Later',
            description: 'Access your saved videos to watch later.',
            type: 'button',
            action: () => this.openWatchLater()
          },
          {
            id: 'clear-library-data',
            icon: 'trash-bin-outline',
            title: 'Clear All Library Data',
            description: 'Removes watch later, and custom playlists data. (Downloads controlled in App Settings)',
            type: 'button',
            action: () => this.clearAllLibraryData(),
            lines: 'full' // Marks the end of the section group
          }
        ]
      },
      {
        header: 'History & Recommendations',
        items: [
          {
            id: 'pause-viewing-history',
            icon: 'eye-off-outline', // Changed icon for 'pause'
            title: 'Pause Viewing History',
            description: 'Videos you watch won\'t appear in your history.',
            type: 'toggle',
            value: this.pauseViewingHistory,
            action: (value: boolean) => this.updatePauseViewingHistory(value)
          },
          {
            id: 'clear-viewing-history',
            icon: 'trash-outline',
            title: 'Clear All Viewing History',
            description: 'Permanently deletes all videos from your watch history.',
            type: 'button',
            action: () => this.clearViewingHistory()
          },
          {
            id: 'pause-search-history',
            icon: 'search-off-outline', // Changed icon for 'pause'
            title: 'Pause Search History',
            description: 'Searches won\'t be saved to your history.',
            type: 'toggle',
            value: this.pauseSearchHistory,
            action: (value: boolean) => this.updatePauseSearchHistory(value)
          },
          {
            id: 'clear-search-history',
            icon: 'trash-outline',
            title: 'Clear All Search History',
            description: 'Permanently deletes all your past searches.',
            type: 'button',
            action: () => this.clearSearchHistory()
          },
          {
            id: 'reset-recommendations',
            icon: 'reload-outline',
            title: 'Reset Recommendations',
            description: 'Clears history influences for new recommendations.',
            type: 'button',
            action: () => this.resetRecommendations(),
            lines: 'full' // Marks the end of the section group
          }
        ]
      }
    ];
  }

  private loadSettings() {
    // Simulate loading settings from a service or local storage
    this.receiveAllSubscriptionNotifications = true;
    this.pauseViewingHistory = false;
    this.pauseSearchHistory = false;

    // Update the values in the settingsSections array
    this.updateSettingsValues();
  }

  private updateSettingsValues() {
    this.settingsSections.forEach(section => {
      section.items.forEach(item => {
        switch (item.id) {
          case 'subscription-notifications':
            item.value = this.receiveAllSubscriptionNotifications;
            break;
          case 'pause-viewing-history':
            item.value = this.pauseViewingHistory;
            break;
          case 'pause-search-history':
            item.value = this.pauseSearchHistory;
            break;
        }
      });
    });
  }

  // --- Action Methods ---

  // Subscriptions
  manageAllSubscriptions() {
    console.log('Navigate to full subscription management page');
    // Implement navigation to a page where users can see and manage all their subscriptions
  }

  updateReceiveAllSubscriptionNotifications(value: boolean) {
    console.log('Receive all subscription notifications:', value);
    this.receiveAllSubscriptionNotifications = value;
    // Save state to a service or local storage
  }

  // Library & Playlists
  openMyPlaylists() {
    console.log('Open My Playlists page');
    // Implement navigation to the playlists management page
  }

  openWatchLater() {
    console.log('Open Watch Later list');
    // Implement navigation to the Watch Later list page
  }

  clearAllLibraryData() {
    console.log('Clear All Library Data (playlists, watch later)');
    // Implement confirmation dialog and then clear logic
    // This would typically remove data stored client-side or reset relevant user data on the backend
  }

  // History & Recommendations
  updatePauseViewingHistory(value: boolean) {
    console.log('Pause Viewing History:', value);
    this.pauseViewingHistory = value;
    // Save state to a service or local storage
  }

  clearViewingHistory() {
    console.log('Clear All Viewing History');
    // Implement confirmation dialog and then clear logic
  }

  updatePauseSearchHistory(value: boolean) {
    console.log('Pause Search History:', value);
    this.pauseSearchHistory = value;
    // Save state to a service or local storage
  }

  clearSearchHistory() {
    console.log('Clear All Search History');
    // Implement confirmation dialog and then clear logic
  }

  resetRecommendations() {
    console.log('Reset Recommendations');
    // Implement confirmation dialog and then logic to clear history-based recommendation data
  }
}
