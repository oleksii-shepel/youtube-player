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

      <ion-item button detail (click)="openEmailSettings()">
        <ion-icon slot="start" name="mail-outline"></ion-icon>
        <ion-label>
          <h2>Email Address</h2>
          <p>your.email</p>
        </ion-label>
      </ion-item>

      <ion-item button detail (click)="openPrivacySettings()">
        <ion-icon slot="start" name="shield-checkmark-outline"></ion-icon>
        <ion-label>
          <h2>Privacy Settings</h2>
          <p>Control who can see your activity.</p>
        </ion-label>
      </ion-item>

      <ion-item lines="full" button detail (click)="openConnectedAccounts()">
        <ion-icon slot="start" name="link-outline"></ion-icon>
        <ion-label>
          <h2>Connected Accounts</h2>
          <p>Manage integrations with other services.</p>
        </ion-label>
      </ion-item>

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
      --ion-color-base: transparent; /* Makes header background transparent */
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
        color: var(--ion-text-color-secondary); /* Default icon color */
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
  constructor() {}
  ngOnInit() {}

  openEditProfileModal() { console.log('Open Edit Profile Modal'); /* Implement ModalController */ }
  openChangePasswordModal() { console.log('Open Change Password Modal'); /* Implement ModalController */ }
  openEmailSettings() { console.log('Open Email Settings'); }
  openPrivacySettings() { console.log('Open Privacy Settings'); }
  openConnectedAccounts() { console.log('Open Connected Accounts'); }
  logout() { console.log('User logout initiated'); /* Implement logout service */ }
  deleteAccount() { console.log('User delete account initiated'); /* Implement delete account logic, with confirmation */ }
}
