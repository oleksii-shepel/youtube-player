import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account-content',
  template: `
    <ion-accordion-group [multiple]="true" class="settings-accordion-group">

      <ion-accordion value="profile-security">
        <ion-item slot="header">
          <ion-icon slot="start" name="person-outline"></ion-icon>
          <ion-label>
            <h2>Profile & Security</h2>
            <p>Manage your account details and security</p>
          </ion-label>
        </ion-item>

        <div slot="content" class="accordion-content">
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

          <ion-card>
            <ion-card-header>
              <ion-card-title>Two-Factor Authentication</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Enable 2FA</ion-label>
                <ion-toggle [(ngModel)]="securitySettings.twoFactorAuth" slot="end" (ionChange)="toggleTwoFactorAuth()"></ion-toggle>
              </ion-item>
              <p class="description">Add an extra layer of security to your account.</p>
            </ion-card-content>
          </ion-card>

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

      <ion-accordion value="privacy-settings">
        <ion-item slot="header">
          <ion-icon slot="start" name="shield-checkmark-outline"></ion-icon>
          <ion-label>
            <h2>Privacy Settings</h2>
            <p>Control your data and audience settings</p>
          </ion-label>
        </ion-item>

        <div slot="content" class="accordion-content">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Activity History</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Save Watch History</ion-label>
                <ion-toggle [(ngModel)]="privacySettings.saveWatchHistory" slot="end" (ionChange)="updatePrivacySetting('saveWatchHistory')"></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-label>Save Search History</ion-label>
                <ion-toggle [(ngModel)]="privacySettings.saveSearchHistory" slot="end" (ionChange)="updatePrivacySetting('saveSearchHistory')"></ion-toggle>
              </ion-item>
              <ion-button expand="block" fill="outline" color="medium" (click)="manageActivity()">Manage Activity</ion-button>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Personalized Ads</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Show Personalized Ads</ion-label>
                <ion-toggle [(ngModel)]="privacySettings.personalizedAds" slot="end" (ionChange)="updatePrivacySetting('personalizedAds')"></ion-toggle>
              </ion-item>
              <p class="description">Receive ads tailored to your interests based on your activity.</p>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Blocked Users</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item *ngIf="blockedUsers.length === 0">
                <ion-label>No users currently blocked.</ion-label>
              </ion-item>
              <ion-item *ngFor="let user of blockedUsers">
                <ion-label>{{user.name}}</ion-label>
                <ion-button slot="end" fill="outline" color="danger" (click)="unblockUser(user)">Unblock</ion-button>
              </ion-item>
              <ion-button expand="block" fill="outline" (click)="addBlockedUser()">Add Blocked User</ion-button>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Comment Settings</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Hold potentially inappropriate comments for review</ion-label>
                <ion-toggle [(ngModel)]="privacySettings.commentModeration" slot="end" (ionChange)="updatePrivacySetting('commentModeration')"></ion-toggle>
              </ion-item>
              <ion-item>
                <ion-label>Allow all comments</ion-label>
                <ion-toggle [(ngModel)]="privacySettings.allowAllComments" slot="end" (ionChange)="updatePrivacySetting('allowAllComments')"></ion-toggle>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Subscription Visibility</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>Keep all my subscriptions private</ion-label>
                <ion-toggle [(ngModel)]="privacySettings.privateSubscriptions" slot="end" (ionChange)="updatePrivacySetting('privateSubscriptions')"></ion-toggle>
              </ion-item>
              <p class="description">Your subscriptions will not be visible to other users.</p>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-accordion>

      <ion-accordion value="subscription-billing">
        <ion-item slot="header">
          <ion-icon slot="start" name="wallet-outline"></ion-icon>
          <ion-label>
            <h2>Subscription & Billing</h2>
            <p>Manage your premium membership and payments</p>
          </ion-label>
        </ion-item>

        <div slot="content" class="accordion-content">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Current Plan</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label>
                  <h3>{{ subscription.planName }}</h3>
                  <p *ngIf="subscription.isActive">{{ subscription.price }} / {{ subscription.renewalPeriod }} (Renews on {{ subscription.renewalDate | date:'shortDate' }})</p>
                  <p *ngIf="!subscription.isActive">No active subscription.</p>
                </ion-label>
                <ion-button *ngIf="!subscription.isActive" slot="end" (click)="subscribe()">Subscribe Now</ion-button>
                <ion-button *ngIf="subscription.isActive" slot="end" fill="outline" (click)="changePlan()">Change Plan</ion-button>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Payment Methods</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item *ngIf="paymentMethods.length === 0">
                <ion-label>No payment methods added.</ion-label>
              </ion-item>
              <ion-item *ngFor="let method of paymentMethods">
                <ion-icon slot="start" [name]="method.icon"></ion-icon>
                <ion-label>
                  <h3>{{method.type}} ending in {{method.lastFour}}</h3>
                  <p>{{method.expiry}}</p>
                </ion-label>
                <ion-button slot="end" fill="outline" color="danger" (click)="removePaymentMethod(method)">Remove</ion-button>
              </ion-item>
              <ion-button expand="block" (click)="addPaymentMethod()">Add Payment Method</ion-button>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Billing History</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item *ngIf="billingHistory.length === 0">
                <ion-label>No billing history found.</ion-label>
              </ion-item>
              <ion-item *ngFor="let bill of billingHistory">
                <ion-label>
                  <h3>{{bill.date | date:'shortDate'}} - {{bill.description}}</h3>
                  <p>{{bill.amount}}</p>
                </ion-label>
                <ion-button slot="end" fill="clear" (click)="viewInvoice(bill)">View Invoice</ion-button>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Cancel Subscription</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="description">You can cancel your subscription at any time. This will take effect at the end of your current billing cycle.</p>
              <ion-button expand="block" color="danger" (click)="cancelSubscription()">Cancel Subscription</ion-button>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-accordion>

    </ion-accordion-group>

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

    ion-note, .description {
      text-align: center;
      display: block;
      margin-top: 12px;
      color: var(--ion-text-color-secondary);
      font-size: 0.85em;
      padding: 0 16px;
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

  // Security settings (new)
  securitySettings = {
    twoFactorAuth: false
  };

  // Connected accounts
  connectedAccounts = [
    { name: 'YouTube', icon: 'logo-youtube', connected: true, status: 'Connected' },
    { name: 'Google', icon: 'logo-google', connected: true, status: 'Connected' },
    { name: 'Twitter', icon: 'logo-twitter', connected: false, status: 'Not connected' }
  ];

  // Privacy settings (new)
  privacySettings = {
    saveWatchHistory: true,
    saveSearchHistory: true,
    personalizedAds: true,
    commentModeration: true,
    allowAllComments: false, // Added for comment moderation nuance
    privateSubscriptions: false
  };

  // Blocked users (new)
  blockedUsers = [
    { id: 'user123', name: 'Spam_Bot_XYZ' },
    { id: 'user456', name: 'AnnoyingViewer' }
  ];

  // Subscription data (new)
  subscription = {
    isActive: true,
    planName: 'YouTube Premium',
    price: '$11.99',
    renewalPeriod: 'month',
    renewalDate: new Date(2025, 7, 18) // July 18, 2025
  };

  // Payment methods (new)
  paymentMethods = [
    { id: 'card1', type: 'Visa', lastFour: '4242', expiry: '12/26', icon: 'card-outline' },
    { id: 'paypal1', type: 'PayPal', lastFour: '****', expiry: 'N/A', icon: 'logo-paypal' }
  ];

  // Billing history (new)
  billingHistory = [
    { id: 'bill001', date: new Date(2025, 6, 18), description: 'YouTube Premium - July', amount: '$11.99' },
    { id: 'bill002', date: new Date(2025, 5, 18), description: 'YouTube Premium - June', amount: '$11.99' }
  ];

  constructor() {}

  ngOnInit() {}

  // Profile methods
  selectAvatar() {
    console.log('Select avatar');
    // Implement avatar selection logic
  }

  saveProfile() {
    console.log('Save profile:', this.profileData);
    // Implement API call to save profile
  }

  // Password methods
  changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      console.log('Passwords do not match');
      // Show an error message to the user
      return;
    }
    console.log('Change password');
    // Implement API call to change password
  }

  // Security methods (new)
  toggleTwoFactorAuth() {
    console.log('Two-factor authentication toggled:', this.securitySettings.twoFactorAuth);
    // Implement logic to enable/disable 2FA
  }

  // Connected accounts
  toggleConnection(account: any) {
    account.connected = !account.connected;
    account.status = account.connected ? 'Connected' : 'Not connected';
    console.log('Toggle connection for:', account.name);
    // Implement API call to update connected account status
  }

  // Privacy methods (new)
  updatePrivacySetting(setting: string) {
    console.log(`${setting} updated:`, (this.privacySettings as any)[setting]);
    // Implement API call to save privacy setting
  }

  manageActivity() {
    console.log('Navigate to activity management page/modal');
    // Implement navigation to a more detailed activity management screen
  }

  addBlockedUser() {
    console.log('Open modal to add blocked user');
    // Implement logic to add a user to the blocked list
  }

  unblockUser(user: any) {
    this.blockedUsers = this.blockedUsers.filter(u => u.id !== user.id);
    console.log('Unblocked user:', user.name);
    // Implement API call to unblock user
  }

  // Subscription & Billing methods (new)
  subscribe() {
    console.log('Navigate to subscription page');
    // Implement navigation to a subscription offer page
  }

  changePlan() {
    console.log('Navigate to change plan options');
    // Implement navigation to change subscription plan
  }

  addPaymentMethod() {
    console.log('Open modal to add payment method');
    // Implement logic to add a new payment method
  }

  removePaymentMethod(method: any) {
    this.paymentMethods = this.paymentMethods.filter(m => m.id !== method.id);
    console.log('Removed payment method:', method.type);
    // Implement API call to remove payment method
  }

  viewInvoice(bill: any) {
    console.log('View invoice for:', bill.id);
    // Implement logic to display or download the invoice
  }

  cancelSubscription() {
    console.log('Initiate subscription cancellation process');
    // Implement API call or confirmation dialog for cancellation
  }

  // Account actions
  logout() {
    console.log('User logout initiated');
    // Implement logout logic (clear tokens, navigate to login)
  }

  deleteAccount() {
    console.log('User delete account initiated');
    // Implement delete account logic (confirmation, API call)
  }
}
