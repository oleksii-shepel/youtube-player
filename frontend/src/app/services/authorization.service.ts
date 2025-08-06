import { Injectable, NgZone } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import {
  fromPromise,
  Subscription,
  timer,
  switchMap,
  catchError,
  Subject,
  createSubject,
} from '@actioncrew/streamix';
import { environment } from 'src/environments/environment';
import { Settings } from './settings.service';
import { AccessToken, UserInfoSettings } from '../interfaces/settings';

declare const google: any;

interface TokenResponse {
  access_token: string;
  authuser: string;
  expires_in: number;
  prompt: string;
  scope: string;
  token_type: string;
}

interface AuthorizationProfile {
  aud: string;
  azp: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name: string;
  given_name: string;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  nbf: number;
  picture: string;
  sub: string;
}

export function convertToDescriptiveToken(raw: TokenResponse): AccessToken {
  return {
    accessToken: raw.access_token,
    authUserIndex: raw.authuser,
    expiresInSeconds: raw.expires_in,
    promptMode: raw.prompt,
    scopesGranted: raw.scope,
    tokenType: raw.token_type,
  };
}

export function convertToTokenResponse(descriptive: AccessToken): TokenResponse {
  return {
    access_token: descriptive.accessToken,
    authuser: descriptive.authUserIndex,
    expires_in: descriptive.expiresInSeconds,
    prompt: descriptive.promptMode,
    scope: descriptive.scopesGranted,
    token_type: descriptive.tokenType,
  };
}

export function convertAuthorizationProfile(raw: AuthorizationProfile): UserInfoSettings {
  return {
    audience: raw.aud,
    authorizedParty: raw.azp,
    email: raw.email,
    isEmailVerified: raw.email_verified,
    expiresAt: raw.exp,
    lastName: raw.family_name,
    firstName: raw.given_name,
    issuedAt: raw.iat,
    issuer: raw.iss,
    tokenId: raw.jti,
    fullName: raw.name,
    validFrom: raw.nbf,
    profilePictureUrl: raw.picture,
    userId: raw.sub,
  };
}

@Injectable({ providedIn: 'root' })
export class Authorization {
  private accessToken: AccessToken | null = null;
  private profile: UserInfoSettings | null = null;
  private autoSignInTimer: Subscription | null = null;

  // Create subject once and make it readonly
  readonly authSubject: Subject<{ profile: UserInfoSettings; accessToken: AccessToken } | null> = createSubject();

  constructor(private zone: NgZone, private settings: Settings) {
    this.profile = this.settings.userInfo.snappy!;
  }

  initializeGsiButton() {
    // Create a custom button that triggers OAuth2 flow directly
    const button = document.getElementById('google-signin-btn');
    if (button) {
      button.addEventListener('click', () => this.signInWithOAuth2());
    }
  }

  // Single OAuth2 flow that gets both profile and access token
  signInWithOAuth2() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: environment.youtube.clientId,
      scope: 'https://www.googleapis.com/auth/youtube openid email profile',
      include_granted_scopes: true,
      callback: (response: TokenResponse) => {
        if (response?.access_token) {
          this.handleOAuth2Response(response);
        } else {
          this.authSubject.error(new Error('OAuth2 authentication failed'));
        }
      },
    });

    tokenClient.requestAccessToken();
  }

  private handleOAuth2Response(response: TokenResponse) {
    try {
      this.accessToken = convertToDescriptiveToken(response);

      // Get user profile using the access token
      this.getUserProfile(response.access_token).then((profile) => {
        this.profile = profile;
        this.setAuthTimer(response.expires_in || 3600);

        // Emit successful authentication
        this.authSubject.next({ profile, accessToken: this.accessToken! });
      }).catch((err) => {
        console.error('Failed to get user profile:', err);
        this.authSubject.error(err);
      });
    } catch (err) {
      console.error('OAuth2 response handling failed:', err);
      this.authSubject.error(err);
    }
  }

  // Get user profile using access token
  private getUserProfile(accessToken: string): Promise<UserInfoSettings> {
    return fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => response.json())
    .then(data => ({
      aud: data.id,
      azp: environment.youtube.clientId,
      email: data.email,
      email_verified: data.verified_email,
      exp: Math.floor(Date.now() / 1000) + 3600,
      family_name: data.family_name || '',
      given_name: data.given_name || '',
      iat: Math.floor(Date.now() / 1000),
      iss: 'https://accounts.google.com',
      jti: '',
      name: data.name,
      nbf: Math.floor(Date.now() / 1000),
      picture: data.picture,
      sub: data.id
    }))
      .then((response) => convertAuthorizationProfile(response))
      .then((settings) => {
        this.settings.updateUserInfo(settings)
        return settings;
      });
  }

  requestAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.zone.run(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: environment.youtube.clientId,
          scope: 'https://www.googleapis.com/auth/youtube',
          prompt: '',
          callback: (response: TokenResponse) => {
            if (response?.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error('Access token request failed'));
            }
          },
        });

        tokenClient.requestAccessToken();
      });
    });
  }

  // Silent token refresh without popup
  private refreshAccessToken(): Promise<AccessToken> {
    return new Promise((resolve, reject) => {
      if (!this.profile) {
        reject(new Error('No profile available for token refresh'));
        return;
      }

      this.zone.run(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: environment.youtube.clientId,
          scope: 'https://www.googleapis.com/auth/youtube',
          prompt: 'none', // This prevents the popup
          hint: this.profile!.email, // Use the existing user's email
          callback: (response: TokenResponse) => {
            if (response?.access_token) {
              resolve(convertToDescriptiveToken(response));
            } else {
              reject(new Error('Token refresh failed'));
            }
          },
        });

        tokenClient.requestAccessToken();
      });
    });
  }

  revokeProfile(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.profile) return resolve();

      google.accounts.id.revoke(this.profile.email, (done: any) => {
        if (done.successful) {
          this.profile = null;
          resolve();
        } else {
          reject(new Error(done.error_description || 'Profile revocation failed'));
        }
      });
    });
  }

  revokeAccessToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.accessToken) return resolve();

      google.accounts.oauth2.revoke(this.accessToken, (done: any) => {
        if (done.successful) {
          this.accessToken = null;
          resolve();
        } else {
          reject(new Error(done.error_description || 'Access token revocation failed'));
        }
      });
    });
  }

  disableAutoSelect() {
    google.accounts.id.disableAutoSelect();
  }

  decodeJwt(token: string): UserInfoSettings {
    return convertAuthorizationProfile(jwtDecode<AuthorizationProfile>(token));
  }

  setAuthTimer(expiresInSeconds: number) {
    this.stopAutoSignInTimer();
    this.autoSignInTimer = this.startTimerToNextAuth(expiresInSeconds * 1000);
  }

  startTimerToNextAuth(timeInMs: number): Subscription {
    return timer(timeInMs)
      .pipe(
        switchMap(() => fromPromise(this.refreshAccessToken())), // Use refreshAccessToken instead
        catchError((error) => {
          console.warn('Token refresh failed, reloading page.', error);
          // Emit null to indicate auth failure before reload
          this.authSubject.next(null);
          window.location.reload();
          return [];
        })
      )
      .subscribe((newToken) => {
        // Update the access token and emit new auth state
        this.accessToken = newToken;
        if (this.profile) {
          this.authSubject.next({
            profile: this.profile,
            accessToken: newToken
          });
        }
      });
  }

  stopAutoSignInTimer() {
    this.autoSignInTimer?.unsubscribe();
    this.autoSignInTimer = null;
  }

  signOut(): Promise<void> {
    return Promise.all([this.revokeProfile(), this.revokeAccessToken()]).then(() => {
      this.stopAutoSignInTimer();
      // Emit null to indicate signed out state
      this.authSubject.next(null);
    }).catch((error) => {
      console.error('Sign out failed:', error);
      // Still emit null state even if revocation fails
      this.authSubject.next(null);
      throw error;
    });
  }

  isSignedIn(): boolean {
    return !!this.profile && !!this.accessToken;
  }

  getAccessToken(): AccessToken | null {
    return this.accessToken;
  }

  getProfile(): UserInfoSettings | null {
    return this.profile;
  }

  // Helper method to get current auth state
  getCurrentAuthState(): { profile: UserInfoSettings; accessToken: AccessToken } | null {
    if (this.profile && this.accessToken) {
      return { profile: this.profile, accessToken: this.accessToken };
    }
    return null;
  }

  // Method to complete the subject when service is destroyed
  completeAuth() {
    this.authSubject.complete();
  }
}
