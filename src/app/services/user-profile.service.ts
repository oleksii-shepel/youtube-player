import { Injectable } from '@angular/core';
import { Subject, createSubject } from '@actioncrew/streamix';
import { Authorization, AuthorizationProfile } from './authorization.service';

export interface UserProfile {
  displayName: string;
  handle: string;
  avatar: string;
  bio?: string;

  privacySettings: {
    saveWatchHistory: boolean;
    saveSearchHistory: boolean;
    personalizedAds: boolean;
    commentModeration: boolean;
    allowAllComments: boolean;
    privateSubscriptions: boolean;
  };

  securitySettings: {
    twoFactorAuth: boolean;
  };

  connectedAccounts: ConnectedAccount[];
  blockedUsers: BlockedUser[];
}

export interface ConnectedAccount {
  name: string;
  icon: string;
  connected: boolean;
  status: string;
}

export interface BlockedUser {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private userProfile: UserProfile | null = null;

  readonly profileSubject: Subject<UserProfile | null> = createSubject<UserProfile | null>();

  constructor(private authorization: Authorization) {
    this.authorization.authSubject.subscribe(authState => {
      if (authState) {
        this.loadUserProfile(authState.profile);
      } else {
        this.clearProfile();
      }
    });
  }

  /**
   * Load user profile from auth and backend preferences
   */
  async loadUserProfile(googleProfile: AuthorizationProfile): Promise<void> {
    try {
      const storedPreferences = await this.getUserPreferences(googleProfile.sub);

      const defaultPrivacy = {
        saveWatchHistory: true,
        saveSearchHistory: true,
        personalizedAds: true,
        commentModeration: true,
        allowAllComments: false,
        privateSubscriptions: false
      };

      const defaultSecurity = {
        twoFactorAuth: false
      };

      this.userProfile = {
        displayName: storedPreferences?.displayName ?? googleProfile.name,
        handle: storedPreferences?.handle ?? `@${googleProfile.given_name?.toLowerCase() ?? 'user'}`,
        avatar: storedPreferences?.avatar ?? googleProfile.picture,
        bio: storedPreferences?.bio ?? '',

        privacySettings: { ...defaultPrivacy, ...storedPreferences?.privacySettings },
        securitySettings: { ...defaultSecurity, ...storedPreferences?.securitySettings },

        connectedAccounts: storedPreferences?.connectedAccounts ?? [
          { name: 'YouTube', icon: 'logo-youtube', connected: true, status: 'Connected' },
          { name: 'Google', icon: 'logo-google', connected: true, status: 'Connected' }
        ],

        blockedUsers: storedPreferences?.blockedUsers ?? []
      };

      this.profileSubject.next(this.userProfile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.profileSubject.error(error instanceof Error ? error : new Error(String(error)));
    }
  }

  getCurrentProfile(): UserProfile | null {
    return this.userProfile;
  }

  private clearProfile(): void {
    this.userProfile = null;
    this.profileSubject.next(null);
  }

  async updateProfile(updates: Partial<Pick<UserProfile, 'displayName' | 'handle' | 'avatar' | 'bio'>>): Promise<UserProfile> {
    if (!this.userProfile) throw new Error('No user profile loaded');

    try {
      this.userProfile = { ...this.userProfile, ...updates };
      await this.saveUserPreferences(this.userProfile);
      this.profileSubject.next(this.userProfile);
      return this.userProfile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  async updatePrivacySettings(settings: Partial<UserProfile['privacySettings']>): Promise<UserProfile['privacySettings']> {
    if (!this.userProfile) throw new Error('No user profile loaded');

    try {
      this.userProfile.privacySettings = { ...this.userProfile.privacySettings, ...settings };
      await this.saveUserPreferences(this.userProfile);
      this.profileSubject.next(this.userProfile);
      return this.userProfile.privacySettings;
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
  }

  async updateSecuritySettings(settings: Partial<UserProfile['securitySettings']>): Promise<UserProfile['securitySettings']> {
    if (!this.userProfile) throw new Error('No user profile loaded');

    try {
      this.userProfile.securitySettings = { ...this.userProfile.securitySettings, ...settings };
      await this.saveUserPreferences(this.userProfile);
      this.profileSubject.next(this.userProfile);
      return this.userProfile.securitySettings;
    } catch (error) {
      console.error('Failed to update security settings:', error);
      throw error;
    }
  }

  async blockUser(userId: string, userName: string): Promise<BlockedUser> {
    if (!this.userProfile) throw new Error('No user profile loaded');

    try {
      const blockedUser: BlockedUser = { id: userId, name: userName };
      this.userProfile.blockedUsers.push(blockedUser);
      await this.saveUserPreferences(this.userProfile);
      this.profileSubject.next(this.userProfile);
      return blockedUser;
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  async unblockUser(userId: string): Promise<BlockedUser[]> {
    if (!this.userProfile) throw new Error('No user profile loaded');

    try {
      this.userProfile.blockedUsers = this.userProfile.blockedUsers.filter(u => u.id !== userId);
      await this.saveUserPreferences(this.userProfile);
      this.profileSubject.next(this.userProfile);
      return this.userProfile.blockedUsers;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  private async getUserPreferences(userId: string): Promise<Partial<UserProfile> | null> {
    try {
      const token = this.authorization.getAccessToken();
      if (!token) throw new Error('No access token available');

      const res = await fetch(`/api/users/${userId}/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch user preferences: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  private async saveUserPreferences(profile: UserProfile): Promise<void> {
    const token = this.authorization.getAccessToken();
    const userId = this.authorization.getProfile()?.sub;

    if (!token) throw new Error('No access token available');
    if (!userId) throw new Error('No user ID available');

    const res = await fetch(`/api/users/${userId}/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });

    if (!res.ok) {
      throw new Error(`Failed to save user preferences: ${res.status} ${res.statusText}`);
    }
  }

  completeProfile(): void {
    this.profileSubject.complete();
  }
}
