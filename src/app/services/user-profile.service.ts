import { Inject, Injectable } from '@angular/core';
import { Stream, Subject, createSubject, firstValueFrom } from '@actioncrew/streamix';
import { Authorization, AuthorizationProfile } from './authorization.service';
import { HTTP_CLIENT } from 'src/main';
import { HttpClient, HttpStream, readJson } from '@actioncrew/streamix/http';

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

  constructor(private authorization: Authorization, @Inject(HTTP_CLIENT) private http: HttpClient) {
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
      const storedPreferences = await firstValueFrom(this.getUserPreferences(googleProfile.sub));

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
      let values = await firstValueFrom(this.saveUserPreferences(this.userProfile));
      console.log(values);
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

  private getUserPreferences(userId: string): HttpStream<UserProfile> {
    try {
      const token = this.authorization.getAccessToken();
      if (!token) throw new Error('No access token available');

      return this.http.get(`https://people.googleapis.com/v1/people/me`, readJson, {
        params: {
          'personFields': 'names,locales,emailAddresses,genders,locations,birthdays,nicknames,photos'
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      throw error;
    }
  }

  private saveUserPreferences(profile: UserProfile): HttpStream<UserProfile> {
    const token = this.authorization.getAccessToken();
    const userId = this.authorization.getProfile()?.sub;

    if (!token) throw new Error('No access token available');
    if (!userId) throw new Error('No user ID available');

    const body = {
      names: [{ displayName: 'Alex Code', familyName: 'Code', givenName: 'Alex' }],
      photos: [{ url: profile.avatar }],
      nicknames: [{ value: 'Ace' }],
      biographies: [{ value: 'Loves coding.' }],
      genders: [{ value: 'male' }],
      birthdays: [{ date: { year: 1990, month: 7, day: 18 } }],
      locations: [{ type: 'home', formattedValue: 'Kyiv, Ukraine' }]
    };

    return this.http.patch(`https://people.googleapis.com/v1/people/${userId}`, readJson, {
      params: {
        updatePersonFields: 'names,photos,nicknames,biographies,genders,birthdays,locations'
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  completeProfile(): void {
    this.profileSubject.complete();
  }
}
