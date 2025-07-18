import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subscription } from '@actioncrew/streamix';
import { UserProfileService, UserProfile } from '../../services/user-profile.service';
import { Authorization } from '../../services/authorization.service'; // Ensure this path is correct

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
          <ng-container *ngIf="isAuthenticated && userProfile">
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
                  <ion-label position="stacked">Bio</ion-label>
                  <ion-textarea [(ngModel)]="profileData.bio" placeholder="Tell us about yourself" rows="3"></ion-textarea>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Avatar</ion-label>
                  <ion-button fill="outline" (click)="selectAvatar()">
                    <ion-icon slot="start" name="camera-outline"></ion-icon>
                    Change Avatar
                  </ion-button>
                </ion-item>
                <ion-button expand="block" (click)="saveProfile()" [disabled]="savingProfile">
                  {{ savingProfile ? 'Saving...' : 'Save Profile' }}
                </ion-button>
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
                  <ion-toggle *ngIf="userProfile.securitySettings"
                              [(ngModel)]="userProfile.securitySettings.twoFactorAuth"
                              slot="end"
                              (ionChange)="toggleTwoFactorAuth()"></ion-toggle>
                </ion-item>
                <p class="description">Add an extra layer of security to your account.</p>
              </ion-card-content>
            </ion-card>

            <ion-card>
              <ion-card-header>
                <ion-card-title>Connected Accounts</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ng-container *ngIf="userProfile.connectedAccounts && userProfile.connectedAccounts.length > 0; else noConnectedAccounts">
                  <ion-item *ngFor="let account of userProfile.connectedAccounts">
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
                </ng-container>
                <ng-template #noConnectedAccounts>
                  <ion-item>
                    <ion-label>No connected accounts.</ion-label>
                  </ion-item>
                </ng-template>
              </ion-card-content>
            </ion-card>
          </ng-container>
          <ion-card *ngIf="!isAuthenticated">
            <ion-card-content class="ion-text-center">
              <p>Please sign in to manage your profile and security settings.</p>
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
          <ng-container *ngIf="isAuthenticated && userProfile">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Activity History</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-item>
                  <ion-label>Save Watch History</ion-label>
                  <ion-toggle *ngIf="userProfile.privacySettings"
                              [(ngModel)]="userProfile.privacySettings.saveWatchHistory"
                              slot="end"
                              (ionChange)="updatePrivacySetting('saveWatchHistory', $event.detail.checked)"></ion-toggle>
                </ion-item>
                <ion-item>
                  <ion-label>Save Search History</ion-label>
                  <ion-toggle *ngIf="userProfile.privacySettings"
                              [(ngModel)]="userProfile.privacySettings.saveSearchHistory"
                              slot="end"
                              (ionChange)="updatePrivacySetting('saveSearchHistory', $event.detail.checked)"></ion-toggle>
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
                  <ion-toggle *ngIf="userProfile.privacySettings"
                              [(ngModel)]="userProfile.privacySettings.personalizedAds"
                              slot="end"
                              (ionChange)="updatePrivacySetting('personalizedAds', $event.detail.checked)"></ion-toggle>
                </ion-item>
                <p class="description">Receive ads tailored to your interests based on your activity.</p>
              </ion-card-content>
            </ion-card>

            <ion-card>
              <ion-card-header>
                <ion-card-title>Blocked Users</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ng-container *ngIf="userProfile.blockedUsers && userProfile.blockedUsers.length > 0; else noBlockedUsersPrivacy">
                  <ion-item *ngFor="let user of userProfile.blockedUsers">
                    <ion-label>{{user.name}}</ion-label>
                    <ion-button slot="end" fill="outline" color="danger" (click)="unblockUser(user.id)">Unblock</ion-button>
                  </ion-item>
                </ng-container>
                <ng-template #noBlockedUsersPrivacy>
                  <ion-item>
                    <ion-label>No users currently blocked.</ion-label>
                  </ion-item>
                </ng-template>
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
                  <ion-toggle *ngIf="userProfile.privacySettings"
                              [(ngModel)]="userProfile.privacySettings.commentModeration"
                              slot="end"
                              (ionChange)="updatePrivacySetting('commentModeration', $event.detail.checked)"></ion-toggle>
                </ion-item>
                <ion-item>
                  <ion-label>Allow all comments</ion-label>
                  <ion-toggle *ngIf="userProfile.privacySettings"
                              [(ngModel)]="userProfile.privacySettings.allowAllComments"
                              slot="end"
                              (ionChange)="updatePrivacySetting('allowAllComments', $event.detail.checked)"></ion-toggle>
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
                  <ion-toggle *ngIf="userProfile.privacySettings"
                              [(ngModel)]="userProfile.privacySettings.privateSubscriptions"
                              slot="end"
                              (ionChange)="updatePrivacySetting('privateSubscriptions', $event.detail.checked)"></ion-toggle>
                </ion-item>
                <p class="description">Your subscriptions will not be visible to other users.</p>
              </ion-card-content>
            </ion-card>
          </ng-container>
          <ion-card *ngIf="!isAuthenticated">
            <ion-card-content class="ion-text-center">
              <p>Please sign in to manage your privacy settings.</p>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-accordion>

      <ion-accordion value="subscription-billing">
        <ion-item slot="header">
          <ion-icon slot="start" name="card-outline"></ion-icon>
          <ion-label>
            <h2>Subscription & Billing</h2>
            <p>Manage your plans and payment methods</p>
          </ion-label>
        </ion-item>

        <div slot="content" class="accordion-content">
          <ng-container *ngIf="isAuthenticated">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Your Subscription</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-item lines="none">
                  <ion-label>
                    <h3>{{ subscription.planName }}</h3>
                    <p>{{ subscription.price }} / {{ subscription.renewalPeriod }}</p>
                  </ion-label>
                  <ion-badge color="{{ subscription.isActive ? 'success' : 'medium' }}" slot="end">
                    {{ subscription.isActive ? 'Active' : 'Inactive' }}
                  </ion-badge>
                </ion-item>
                <ion-item lines="none">
                  <ion-label>Next Renewal:</ion-label>
                  <ion-text slot="end">{{ subscription.renewalDate | date:'longDate' }}</ion-text>
                </ion-item>
                <ion-button expand="block" fill="outline" color="primary">Manage Subscription</ion-button>
              </ion-card-content>
            </ion-card>

            <ion-card>
              <ion-card-header>
                <ion-card-title>Payment Methods</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-item *ngFor="let method of paymentMethods">
                  <ion-icon slot="start" [name]="method.icon"></ion-icon>
                  <ion-label>
                    <h3>{{ method.type }}</h3>
                    <p>**** {{ method.lastFour }} - Exp: {{ method.expiry }}</p>
                  </ion-label>
                  <ion-button slot="end" fill="outline" color="medium">Edit</ion-button>
                </ion-item>
                <ion-button expand="block" fill="outline">Add Payment Method</ion-button>
              </ion-card-content>
            </ion-card>

            <ion-card>
              <ion-card-header>
                <ion-card-title>Billing History</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-item *ngFor="let bill of billingHistory">
                  <ion-label>
                    <h3>{{ bill.description }}</h3>
                    <p>{{ bill.date | date:'mediumDate' }}</p>
                  </ion-label>
                  <ion-text slot="end">{{ bill.amount }}</ion-text>
                </ion-item>
                <ion-button expand="block" fill="outline">View Full History</ion-button>
              </ion-card-content>
            </ion-card>
          </ng-container>
          <ion-card *ngIf="!isAuthenticated">
            <ion-card-content class="ion-text-center">
              <p>Please sign in to view your subscription and billing details.</p>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-accordion>

    </ion-accordion-group>

    <div class="account-actions">
      <ng-container *ngIf="isAuthenticated">
        <ion-button button class="action-item logout-item" (click)="logout()">
          <ion-icon slot="start" name="log-out-outline" color="danger"></ion-icon>
          <ion-label color="danger">Sign Out</ion-label>
        </ion-button>
        <ion-button button class="action-item delete-account-item" (click)="deleteAccount()">
          <ion-icon slot="start" name="trash-outline" color="danger"></ion-icon>
          <ion-label color="danger">Delete Account</ion-label>
        </ion-button>
      </ng-container>

      <ion-button *ngIf="!isAuthenticated"  class="action-item login-item" (click)="signIn()">
        <ion-icon slot="start" name="log-in-outline" color="primary"></ion-icon>
        <ion-label color="primary">Sign In</ion-label>
      </ion-button>
    </div>
  `,
  styles: [`
    /* Existing styles, just adjusted button selectors */
    .settings-accordion-group {
      margin-bottom: 20px;
    }

    .accordion-content {
      padding: 10px;
    }

    ion-card {
      margin-bottom: 15px;
    }

    ion-card-title {
      font-size: 1.1em;
      font-weight: 600;
      padding-bottom: 5px;
    }

    ion-item .description {
      font-size: 0.85em;
      color: var(--ion-color-medium);
      margin-top: 5px;
    }

    ion-toggle {
      --handle-width: 28px;
      --handle-height: 28px;
      --handle-max-width: 28px;
      --handle-spacing: 6px;
    }

    /* Common style for action buttons in the list */
    .action-item {
      --background: var(--ion-color-light);
      margin: 0;
      border-radius: var(--ion-border-radius); /* Example: Add some rounded corners */
      box-shadow: var(--ion-box-shadow); /* Example: Add a subtle shadow */
      --padding-start: 16px;
      --padding-end: 16px;
    }

    .account-actions {
      display: inline-flex;
      gap: 10px;
    }

    .ion-text-center {
      text-align: center;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class AccountContentComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  savingProfile = false;
  isAuthenticated = false; // Property to track authentication status

  profileData = {
    displayName: '',
    handle: '',
    avatar: '',
    bio: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Static subscription and payment data - typically these would also come from a service
  subscription = {
    isActive: true,
    planName: 'YouTube Premium',
    price: '$11.99',
    renewalPeriod: 'month',
    renewalDate: new Date(2025, 7, 18) // Corrected date to match current year
  };

  paymentMethods = [
    { id: 'card1', type: 'Visa', lastFour: '4242', expiry: '12/26', icon: 'card-outline' },
    { id: 'paypal1', type: 'PayPal', lastFour: '****', expiry: 'N/A', icon: 'logo-paypal' }
  ];

  billingHistory = [
    { id: 'bill001', date: new Date(2025, 6, 18), description: 'YouTube Premium - July', amount: '$11.99' },
    { id: 'bill002', date: new Date(2025, 5, 18), description: 'YouTube Premium - June', amount: '$11.99'}
  ];

  private profileSubscription: Subscription | null = null;
  private authStatusSubscription: Subscription | null = null;

  constructor(
    private userProfileService: UserProfileService,
    private authorization: Authorization // Inject your Authorization service
  ) {}

  ngOnInit() {
    // 1. Subscribe to the authentication status from the Authorization service's `authSubject`
    // This will drive the display of authenticated/unauthenticated content
    this.authStatusSubscription = this.authorization.authSubject.subscribe(authData => {
      // If authData is an object, it means the user is authenticated. If null, they are not.
      this.isAuthenticated = !!authData; // Convert object/null to boolean

      // The UserProfileService already handles updating its internal profile and
      // emitting through profileSubject when authData changes.
      // So, we just need to listen to userProfileService.profileSubject.
    });

    // 2. Subscribe to the UserProfileService's profileSubject to get the actual user profile data.
    // This subscription needs to be active regardless of the current isAuthenticated status,
    // as the UserProfileService will emit null when the user logs out.
    this.profileSubscription = this.userProfileService.profileSubject.subscribe(profile => {
      this.userProfile = profile;
      if (profile) {
        // Initialize profileData for form binding when profile is available
        this.profileData = {
          displayName: profile.displayName,
          handle: profile.handle,
          avatar: profile.avatar,
          bio: profile.bio || ''
        };
        // Ensure nested objects are initialized if they can be missing (important for ngModel)
        // These checks are crucial to prevent template errors if preferences aren't fully loaded
        if (!profile.securitySettings) {
          profile.securitySettings = { twoFactorAuth: false };
        }
        if (!profile.privacySettings) {
          profile.privacySettings = {
            saveWatchHistory: false,
            saveSearchHistory: false,
            personalizedAds: false,
            commentModeration: false,
            allowAllComments: false,
            privateSubscriptions: false
          };
        }
        if (!profile.connectedAccounts) {
          profile.connectedAccounts = [];
        }
        if (!profile.blockedUsers) {
          profile.blockedUsers = [];
        }
      } else {
        // If profile becomes null (e.g., user logs out), reset profileData
        this.profileData = { displayName: '', handle: '', avatar: '', bio: '' };
      }
    });

    // 3. Set initial isAuthenticated state based on the current state of Authorization service.
    // This ensures the component is correctly rendered on first load.
    this.isAuthenticated = !!this.authorization.getProfile() && !!this.authorization.getAccessToken();
  }


  ngOnDestroy() {
    this.profileSubscription?.unsubscribe();
    this.authStatusSubscription?.unsubscribe(); // Crucial to unsubscribe from auth status
  }

  // --- Profile Management Methods ---
  selectAvatar() {
    console.log('Select avatar functionality to be implemented.');
  }

  async saveProfile() {
    if (!this.userProfile) return; // Should not happen with *ngIf, but good safeguard

    this.savingProfile = true;
    try {
      await this.userProfileService.updateProfile(this.profileData);
      console.log('Profile saved successfully!');
      // Display a success message (e.g., using ToastController)
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Display an error message
    } finally {
      this.savingProfile = false;
    }
  }

  // --- Security Settings Methods ---
  async changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      console.error('New passwords do not match.');
      // Display an error to the user
      return;
    }
    console.log('Change password functionality to be implemented.');
    // In a real app, you'd call a security service here, likely not directly on UserProfileService unless it handles that specific logic.
  }

  async toggleTwoFactorAuth() {
    if (!this.userProfile?.securitySettings) return;

    try {
      // Assuming userProfileService.updateSecuritySettings accepts a partial object
      await this.userProfileService.updateSecuritySettings({
        twoFactorAuth: this.userProfile.securitySettings.twoFactorAuth
      });
      console.log('Two-factor authentication setting updated.');
    } catch (error) {
      console.error('Failed to update 2FA setting:', error);
      // Optionally, revert the toggle state on UI if API call fails
      if (this.userProfile.securitySettings) {
        this.userProfile.securitySettings.twoFactorAuth = !this.userProfile.securitySettings.twoFactorAuth;
      }
    }
  }

  toggleConnection(account: any) {
    account.connected = !account.connected;
    account.status = account.connected ? 'Connected' : 'Not connected';
    console.log('Toggle connection for:', account.name);
    // Implement API call to update connected account status via UserProfileService or dedicated service
  }

  // --- Privacy Settings Methods ---
  async updatePrivacySetting(setting: keyof UserProfile['privacySettings'], value: boolean) {
    if (!this.userProfile?.privacySettings) return;

    try {
      // Create a partial object for the update
      const updatePayload: Partial<UserProfile['privacySettings']> = { [setting]: value } as any;
      await this.userProfileService.updatePrivacySettings(updatePayload);
      console.log(`Privacy setting "${setting}" updated to:`, value);
    } catch (error) {
      console.error(`Failed to update privacy setting "${setting}":`, error);
      // Optionally, revert the toggle state on UI if API call fails
      if (this.userProfile.privacySettings) {
        (this.userProfile.privacySettings as any)[setting] = !value; // Revert
      }
    }
  }

  manageActivity() {
    console.log('Navigate to activity management page/modal.');
  }

  async unblockUser(userId: string) {
    if (!this.userProfile) return;

    try {
      await this.userProfileService.unblockUser(userId);
      console.log(`User ${userId} unblocked successfully.`);
      // The profileSubject subscription will update userProfile automatically
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  }

  // Note: The UserProfileService provides `blockUser`.
  // You might want to implement a method here to prompt for user ID/name and call that.
  addBlockedUser() {
    console.log('Open modal/page to add a blocked user.');
    // Example: this.userProfileService.blockUser('someId', 'Some Name');
  }

  // --- Authentication Actions ---
  async signIn() {
    console.log('Sign In button clicked. Initiating Google OAuth2 sign-in...');
    try {
        await this.authorization.signInWithOAuth2();
        console.log('Sign In process initiated by AccountContentComponent.');
        // The authStatusSubscription will eventually update isAuthenticated
        // and the profileSubscription will receive the userProfile from UserProfileService.
    } catch (error) {
        console.error('Sign In failed:', error);
        // Show an error to the user
    }
  }

  async logout() {
    console.log('Sign Out button clicked. Initiating logout...');
    try {
      await this.authorization.signOut();
      console.log('User signed out successfully.');
      // The authStatusSubscription will handle setting isAuthenticated to false
      // and profileSubscription will receive null for userProfile.
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  deleteAccount() {
    console.log('Delete Account button clicked. Confirmation dialog needed!');
    // Implement confirmation dialog and call backend service to delete account
  }
}
