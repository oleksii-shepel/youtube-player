// src/app/settings/subscriptions-content/subscriptions-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subscriptions-content',
  template: `
    <ion-list lines="none" class="settings-list">
      <ion-list-header>
        <ion-label color="tertiary">Your Subscriptions</ion-label>
      </ion-list-header>

      <ion-item>
        <ion-thumbnail slot="start">
          <img src="https://via.placeholder.com/50x50?text=Chan1" alt="Channel 1 Avatar">
        </ion-thumbnail>
        <ion-label>
          <h2>Creative Minds</h2>
          <p>500K subscribers</p>
        </ion-label>
        <ion-button slot="end" fill="outline" color="danger" (click)="unsubscribe('Creative Minds')">Unsubscribe</ion-button>
      </ion-item>

      <ion-item>
        <ion-thumbnail slot="start">
          <img src="https://via.placeholder.com/50x50?text=Chan2" alt="Channel 2 Avatar">
        </ion-thumbnail>
        <ion-label>
          <h2>Tech Insights</h2>
          <p>1.2M subscribers</p>
        </ion-label>
        <ion-button slot="end" fill="outline" color="danger" (click)="unsubscribe('Tech Insights')">Unsubscribe</ion-button>
      </ion-item>

      <ion-item>
        <ion-thumbnail slot="start">
          <img src="https://via.placeholder.com/50x50?text=Chan3" alt="Channel 3 Avatar">
        </ion-thumbnail>
        <ion-label>
          <h2>Gaming Universe</h2>
          <p>800K subscribers</p>
        </ion-label>
        <ion-button slot="end" fill="outline" color="danger" (click)="unsubscribe('Gaming Universe')">Unsubscribe</ion-button>
      </ion-item>

      <ion-item lines="full" button (click)="manageAllSubscriptions()">
        <ion-icon slot="start" name="list-outline"></ion-icon>
        <ion-label>
          <h2>Manage All Subscriptions</h2>
          <p>View and organize all your subscribed channels.</p>
        </ion-label>
        <ion-icon slot="end" name="chevron-forward-outline"></ion-icon>
      </ion-item>

      <ion-list-header>
        <ion-label color="tertiary">Subscription Notifications</ion-label>
      </ion-list-header>

      <ion-item lines="none">
        <ion-icon slot="start" name="bell-outline"></ion-icon>
        <ion-label>
          <h2>Receive all notifications</h2>
          <p>Get notified for every new upload.</p>
        </ion-label>
        <ion-toggle slot="end" [(ngModel)]="receiveAllNotifications"></ion-toggle>
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
    ion-thumbnail {
      --size: 50px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 12px;
    }
    ion-toggle {
        margin-inline-start: auto;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class SubscriptionsContentComponent implements OnInit {
  receiveAllNotifications: boolean = true;

  constructor() {}
  ngOnInit() {}

  unsubscribe(channelName: string) { console.log('Unsubscribe from:', channelName); /* Implement API call */ }
  manageAllSubscriptions() { console.log('Navigate to full subscription management page'); /* Could route or open modal */ }
}
