import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import {
  fromPromise,
  Subscription,
  timer,
  switchMap,
  catchError,
  Subject,
  createSubject,
  zip,
  tap,
  takeUntil,
} from '@epikodelabs/streamix';
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

// 🔹 Constants
const TOKEN_REFRESH_BUFFER_SECONDS = 60; // Refresh 1 minute before expiration
const MIN_TIMER_DURATION_SECONDS = 300; // Minimum 5 minutes
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3600; // 1 hour fallback

// 🔹 Converters
export function convertToDescriptiveToken(raw: TokenResponse): AccessToken {
  return {
    accessToken: raw.access_token,
    authUserIndex: raw.authuser,
    expiresInSeconds: raw.expires_in,
    promptMode: raw.prompt,
    scopesGranted: raw.scope,
    tokenType: raw.token_type,
    validFrom: Math.floor(Date.now() / 1000) // Set when token is created
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

export interface AuthState {
  profile: UserInfoSettings;
  accessToken: AccessToken;
}

@Injectable({ providedIn: 'root' })
export class Authorization {
  private autoSignInTimer: Subscription | null = null;
  private destroy$ = createSubject<void>();
  private isGsiInitialized = false;

  readonly authSubject: Subject<AuthState | null> = createSubject();

  constructor(private zone: NgZone, private settings: Settings) {

    queueMicrotask(() => {
      this.initializeGoogleServices();
      this.initializeSettings();
    });
  }

  // 🔹 Google Services Initialization
  private initializeGoogleServices() {
    // Initialize Google Identity Services
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id: environment.youtube.clientId,
        callback: () => {}, // Empty callback since we're using OAuth2 flow
        auto_select: true,
        cancel_on_tap_outside: true,
      });
      this.isGsiInitialized = true;
      console.log('Google Identity Services initialized');
    } else {
      console.warn('Google Identity Services not available');
    }
  }

  // 🔹 Token Validation Helpers
  private calculateRemainingTokenTime(token: AccessToken): number {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = token.validFrom + token.expiresInSeconds;
    const remainingSeconds = expiresAt - now;
    return Math.max(0, remainingSeconds);
  }

  private isTokenExpired(token: AccessToken): boolean {
    return (
      this.calculateRemainingTokenTime(token) <= TOKEN_REFRESH_BUFFER_SECONDS
    );
  }

  private validateTokenResponse(response: TokenResponse): boolean {
    return !!(
      response?.access_token &&
      response.expires_in > 0 &&
      response.token_type &&
      response.scope
    );
  }

  // 🔹 Initialization
  initializeSettings() {
    zip(this.settings.accessToken, this.settings.userInfo)
      .pipe(
        tap(([accessToken, profile]) =>
          this.handleStoredAuth(accessToken, profile)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private handleStoredAuth(
    accessToken: AccessToken | null,
    profile: UserInfoSettings | null
  ) {
    // No stored auth data
    if (!accessToken?.accessToken || !profile?.email) {
      this.authSubject.next(null);
      return;
    }

    // Token expired - sign out
    if (this.isTokenExpired(accessToken)) {
      console.log('Stored token has expired, signing out');
      this.signOut().catch(console.error);
      return;
    }

    // Valid token - set up timer and emit auth state
    const remainingSeconds = this.calculateRemainingTokenTime(accessToken);
    console.log(`Token expires in ${remainingSeconds} seconds`);

    this.setAuthTimer(remainingSeconds - TOKEN_REFRESH_BUFFER_SECONDS);
    this.authSubject.next({ accessToken, profile });
  }

  // 🔹 Google Sign-In Integration
  initializeGsiButton() {
    const button = document.getElementById('google-signin-btn');
    if (button) {
      button.addEventListener('click', () => this.signInWithOAuth2());
    }
  }

  signInWithOAuth2(): Promise<AuthState> {
    return new Promise((resolve, reject) => {
      this.zone.run(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: environment.youtube.clientId,
          scope: 'https://www.googleapis.com/auth/youtube openid email profile',
          include_granted_scopes: true,
          hint: this.settings.userInfo.value?.email,
          callback: (response: TokenResponse) => {
            if (this.validateTokenResponse(response)) {
              this.handleOAuth2Response(response).then(resolve).catch(reject);
            } else {
              const error = new Error(
                'OAuth2 authentication failed: Invalid token response'
              );
              this.handleAuthError(error, 'signInWithOAuth2');
              reject(error);
            }
          },
        });

        tokenClient.requestAccessToken();
      });
    });
  }

  private async handleOAuth2Response(
    response: TokenResponse
  ): Promise<AuthState> {
    try {
      const token = convertToDescriptiveToken(response);
      await this.settings.updateAccessToken(token);

      const profile = await this.getUserProfile(token);
      await this.settings.updateUserInfo(profile);

      const timerSeconds = Math.max(
        token.expiresInSeconds - TOKEN_REFRESH_BUFFER_SECONDS,
        MIN_TIMER_DURATION_SECONDS
      );
      this.setAuthTimer(timerSeconds);

      const authState: AuthState = { profile, accessToken: token };
      this.authSubject.next(authState);
      return authState;
    } catch (error) {
      this.handleAuthError(error as Error, 'handleOAuth2Response');
      throw error;
    }
  }

  // 🔹 Profile Management
  private async getUserProfile(
    accessToken: AccessToken
  ): Promise<UserInfoSettings> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Profile request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const now = Math.floor(Date.now() / 1000);

      const profile: AuthorizationProfile = {
        aud: data.id,
        azp: environment.youtube.clientId,
        email: data.email,
        email_verified: data.verified_email ?? false,
        exp: now + DEFAULT_TOKEN_LIFETIME_SECONDS,
        family_name: data.family_name || '',
        given_name: data.given_name || '',
        iat: now,
        iss: 'https://accounts.google.com',
        jti: data.jti || '',
        name: data.name || '',
        nbf: now,
        picture: data.picture || '',
        sub: data.id,
      };

      return convertAuthorizationProfile(profile);
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error}`);
    }
  }

  // 🔹 Token Management
  requestAccessToken(): Promise<AccessToken> {
    return new Promise((resolve, reject) => {
      this.zone.run(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: environment.youtube.clientId,
          scope: 'https://www.googleapis.com/auth/youtube',
          prompt: 'none',
          callback: (response: TokenResponse) => {
            if (this.validateTokenResponse(response)) {
              const token = convertToDescriptiveToken(response);
              this.settings.updateAccessToken(token);
              resolve(token);
            } else {
              reject(
                new Error('Access token request failed: Invalid response')
              );
            }
          },
        });

        tokenClient.requestAccessToken();
      });
    });
  }

  private refreshAccessToken(): Promise<AccessToken> {
    return new Promise((resolve, reject) => {
      const profile = this.settings.userInfo.value;

      if (!profile?.email) {
        reject(new Error('No profile available for token refresh'));
        return;
      }

      this.zone.run(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: environment.youtube.clientId,
          scope: 'https://www.googleapis.com/auth/youtube',
          prompt: 'none',
          hint: profile.email,
          callback: (response: TokenResponse) => {
            if (this.validateTokenResponse(response)) {
              const token = convertToDescriptiveToken(response);
              this.settings.updateAccessToken(token);
              resolve(token);
            } else {
              reject(new Error('Token refresh failed: Invalid response'));
            }
          },
        });

        tokenClient.requestAccessToken();
      });
    });
  }

  // 🔹 Timer Management
  setAuthTimer(remainingSeconds: number) {
    this.stopAutoSignInTimer();

    if (remainingSeconds <= 0) {
      console.warn('Token expires very soon, attempting immediate refresh');
      this.attemptTokenRefresh();
      return;
    }

    console.log(`Setting auth timer for ${remainingSeconds} seconds`);
    this.autoSignInTimer = this.startTimerToNextAuth(remainingSeconds * 1000);
  }

  private startTimerToNextAuth(timeInMs: number): Subscription {
    return timer(timeInMs)
      .pipe(
        switchMap(() => fromPromise(this.refreshAccessToken())),
        catchError((error) => {
          console.warn('Token refresh failed, signing out user', error);
          this.signOut().catch(console.error);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((newToken) => {
        const profile = this.settings.userInfo.value;
        if (profile?.email && newToken) {
          // Set up next refresh timer
          const nextRefreshSeconds = Math.max(
            newToken.expiresInSeconds - TOKEN_REFRESH_BUFFER_SECONDS,
            MIN_TIMER_DURATION_SECONDS
          );
          this.setAuthTimer(nextRefreshSeconds);

          this.authSubject.next({
            profile,
            accessToken: newToken,
          });
        }
      });
  }

  private attemptTokenRefresh() {
    fromPromise(this.refreshAccessToken())
      .pipe(
        catchError((error) => {
          console.warn('Token refresh failed, signing out', error);
          this.signOut().catch(console.error);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((newToken) => {
        if (newToken) {
          const profile = this.settings.userInfo.value;
          if (profile?.email) {
            this.setAuthTimer(
              newToken.expiresInSeconds - TOKEN_REFRESH_BUFFER_SECONDS
            );
            this.authSubject.next({ profile, accessToken: newToken });
          }
        }
      });
  }

  stopAutoSignInTimer() {
    this.autoSignInTimer?.unsubscribe();
    this.autoSignInTimer = null;
  }

  // 🔹 Sign Out & Revocation
  async revokeProfile(): Promise<void> {
    const profile = this.settings.userInfo.value;
    if (!profile?.email || !this.isGsiInitialized) {
      console.warn('Cannot revoke profile: GSI not initialized or no profile');
      this.settings.userInfo.next(defaultUserInfoSettings);
      return;
    }

    return new Promise((resolve, reject) => {
      google.accounts.id.revoke(profile.email, (result: any) => {
        this.settings.userInfo.next(defaultUserInfoSettings);
        if (result.successful) {
          resolve();
        } else {
          console.warn('Profile revocation failed:', result);
          // Still clear the profile locally even if revocation fails
          reject(
            new Error(result.error_description || 'Profile revocation failed')
          );
        }
      });
    });
  }

  async revokeAccessToken(): Promise<void> {
    const token = this.settings.accessToken.value;
    if (!token?.accessToken) {
      console.warn('No access token to revoke');
      this.settings.accessToken.next(defaultAccessToken);
      return;
    }

    return new Promise((resolve, reject) => {
      google.accounts.oauth2.revoke(token.accessToken, (result: any) => {
        this.settings.accessToken.next(defaultAccessToken);
        if (result.successful) {
          resolve();
        } else {
          console.warn('Access token revocation failed:', result);
          // Still clear the token locally even if revocation fails
          reject(
            new Error(
              result.error_description || 'Access token revocation failed'
            )
          );
        }
      });
    });
  }

  async signOut(): Promise<void> {
    try {
      this.stopAutoSignInTimer();

      // Use Promise.allSettled to ensure both operations complete
      const results = await Promise.allSettled([
        this.revokeProfile(),
        this.revokeAccessToken(),
      ]);

      // Log any failures but don't throw
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const operation = index === 0 ? 'profile revocation' : 'token revocation';
          console.warn(`${operation} failed:`, result.reason);
        }
      });

      this.authSubject.next(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      // Ensure user is signed out locally even if revocation fails
      this.settings.userInfo.next(defaultUserInfoSettings);
      this.settings.accessToken.next(defaultAccessToken);
      this.authSubject.next(null);
      throw error;
    }
  }

  // 🔹 Utility Methods
  disableAutoSelect() {
    if (this.isGsiInitialized) {
      google.accounts.id.disableAutoSelect();
    }
  }

  decodeJwt(token: string): UserInfoSettings {
    return convertAuthorizationProfile(jwtDecode<AuthorizationProfile>(token));
  }

  isSignedIn(): boolean {
    const token = this.getAccessToken();
    const profile = this.getProfile();
    return !!(
      profile?.email &&
      token?.accessToken &&
      !this.isTokenExpired(token)
    );
  }

  getAccessToken(): AccessToken | null {
    return this.settings.accessToken.value ?? null;
  }

  getProfile(): UserInfoSettings | null {
    return this.settings.userInfo.value ?? null;
  }

  getCurrentAuthState(): AuthState | null {
    const profile = this.getProfile();
    const accessToken = this.getAccessToken();
    return profile && accessToken && !this.isTokenExpired(accessToken)
      ? { profile, accessToken }
      : null;
  }

  checkTokenValidity(): { isValid: boolean; remainingSeconds: number } {
    const token = this.getAccessToken();
    if (!token?.accessToken) {
      return { isValid: false, remainingSeconds: 0 };
    }

    const remainingSeconds = this.calculateRemainingTokenTime(token);
    return {
      isValid: remainingSeconds > TOKEN_REFRESH_BUFFER_SECONDS,
      remainingSeconds,
    };
  }

  private handleAuthError(error: Error, context: string) {
    console.error(`Auth error in ${context}:`, error);
    this.authSubject.error(error);
  }

  completeAuth() {
    this.authSubject.complete();
  }

  getDefaultAvatarUrl(): string {
    const initials = this.settings.userInfo.value?.firstName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <rect width="100" height="100" fill="#555"/>
          <text x="50%" y="55%" font-size="40" text-anchor="middle" fill="#fff" font-family="Arial" dy=".3em">${initials}</text>
        </svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}
