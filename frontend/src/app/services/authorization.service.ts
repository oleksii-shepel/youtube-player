import { Subscription as SubscriptionSettings } from './../interfaces/settings';
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
import { defaultAccessToken, defaultUserInfoSettings, Settings } from './settings.service';
import { AccessToken, UserInfoSettings } from '../interfaces/settings';

declare const google: any;

// 🔹 Types for Google's OAuth2 responses
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

// 🔹 Converters
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
  private autoSignInTimer: Subscription | null = null;
  private subscriptions: Subscription[] = [];

  readonly authSubject: Subject<{ profile: UserInfoSettings; accessToken: AccessToken } | null> = createSubject();

  constructor(private zone: NgZone, private settings: Settings) {}

  initializeGsiButton() {
    const button = document.getElementById('google-signin-btn');
    if (button) {
      button.addEventListener('click', () => this.signInWithOAuth2());
    }
  }

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
      const token = convertToDescriptiveToken(response);
      this.settings.updateAccessToken(token);

      this.getUserProfile(token).then((profile) => {
        this.settings.updateUserInfo(profile);
        this.setAuthTimer(token.expiresInSeconds || 3600);

        this.authSubject.next({ profile, accessToken: token });
      }).catch((err) => {
        console.error('Failed to get user profile:', err);
        this.authSubject.error(err);
      });
    } catch (err) {
      console.error('OAuth2 response handling failed:', err);
      this.authSubject.error(err);
    }
  }

  private getUserProfile(accessToken: AccessToken): Promise<UserInfoSettings> {
    return fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken.accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const now = Math.floor(Date.now() / 1000);
        const profile: AuthorizationProfile = {
          aud: data.id,
          azp: environment.youtube.clientId,
          email: data.email,
          email_verified: data.verified_email,
          exp: now + 3600,
          family_name: data.family_name || '',
          given_name: data.given_name || '',
          iat: now,
          iss: 'https://accounts.google.com',
          jti: '',
          name: data.name,
          nbf: now,
          picture: data.picture,
          sub: data.id,
        };
        return convertAuthorizationProfile(profile);
      });
  }

  requestAccessToken(): Promise<AccessToken> {
    return new Promise((resolve, reject) => {
      this.zone.run(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: environment.youtube.clientId,
          scope: 'https://www.googleapis.com/auth/youtube',
          prompt: '',
          callback: (response: TokenResponse) => {
            if (response?.access_token) {
              const token = convertToDescriptiveToken(response);
              this.settings.updateAccessToken(token);
              resolve(token);
            } else {
              reject(new Error('Access token request failed'));
            }
          },
        });

        tokenClient.requestAccessToken();
      });
    });
  }

  private refreshAccessToken(): Promise<AccessToken> {
    return new Promise((resolve, reject) => {
      if (!this.settings.userInfo.snappy?.email) {
        reject(new Error('No profile available for token refresh'));
        return;
      }

      this.zone.run(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: environment.youtube.clientId,
          scope: 'https://www.googleapis.com/auth/youtube',
          prompt: 'none',
          hint: this.settings.userInfo.snappy!.email,
          callback: (response: TokenResponse) => {
            if (response?.access_token) {
              const token = convertToDescriptiveToken(response);
              this.settings.updateAccessToken(token);
              resolve(token);
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
      if (!this.settings.userInfo.snappy?.email) return resolve();

      google.accounts.id.revoke(this.settings.userInfo.snappy.email, (done: any) => {
        if (done.successful) {
          this.settings.userInfo.next(defaultUserInfoSettings);
          resolve();
        } else {
          reject(new Error(done.error_description || 'Profile revocation failed'));
        }
      });
    });
  }

  revokeAccessToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.settings.accessToken.snappy?.accessToken) return resolve();

      google.accounts.oauth2.revoke(this.settings.accessToken.snappy.accessToken, (done: any) => {
        if (done.successful) {
          this.settings.accessToken.next(defaultAccessToken);
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
        switchMap(() => fromPromise(this.refreshAccessToken())),
        catchError((error) => {
          console.warn('Token refresh failed, reloading page.', error);
          this.authSubject.next(null);
          window.location.reload();
          return [];
        })
      )
      .subscribe((newToken) => {
        const profile = this.settings.userInfo.snappy;
        if (profile?.email) {
          this.authSubject.next({
            profile,
            accessToken: newToken,
          });
        }
      });
  }

  stopAutoSignInTimer() {
    this.autoSignInTimer?.unsubscribe();
    this.autoSignInTimer = null;
  }

  signOut(): Promise<void> {
    return Promise.all([this.revokeProfile(), this.revokeAccessToken()])
      .then(() => {
        this.stopAutoSignInTimer();
        this.authSubject.next(null);
      })
      .catch((error) => {
        console.error('Sign out failed:', error);
        this.authSubject.next(null);
        throw error;
      });
  }

  isSignedIn(): boolean {
    return !!this.settings.userInfo.snappy?.email && !!this.settings.accessToken.snappy?.accessToken;
  }

  getAccessToken(): AccessToken | null {
    return this.settings.accessToken.snappy ?? null;
  }

  getProfile(): UserInfoSettings | null {
    return this.settings.userInfo.snappy ?? null;
  }

  getCurrentAuthState(): { profile: UserInfoSettings; accessToken: AccessToken } | null {
    const profile = this.getProfile();
    const accessToken = this.getAccessToken();
    return profile && accessToken ? { profile, accessToken } : null;
  }

  completeAuth() {
    this.authSubject.complete();
  }
}
