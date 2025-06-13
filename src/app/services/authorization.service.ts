import { Injectable, NgZone } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import {
  createSubject,
  fromPromise,
  Stream,
  Subscription,
  timer,
  switchMap,
  map,
  catchError,
} from '@actioncrew/streamix';
import { environment } from 'src/environments/environment';

declare const google: any;

export interface TokenResponse {
  access_token: string;
  authuser: string;
  expires_in: number;
  prompt: string;
  scope: string;
  token_type: string;
}

export interface AuthorizationProfile {
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

@Injectable({ providedIn: 'root' })
export class Authorization {
  private accessToken: string | null = null;
  private profile: AuthorizationProfile | null = null;
  private autoSignInTimer: Subscription | null = null;

  constructor(private zone: NgZone) {
    google.accounts.id.initialize({
      client_id: environment.youtube.clientId,
      callback: (response: any) => {
        // No-op here: we handle login explicitly in loadAuth
      },
    });
  }

  loadAuth(): Stream<{ profile: AuthorizationProfile; accessToken: string }> {
    const subject = createSubject<{ profile: AuthorizationProfile; accessToken: string }>();

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        subject.error(new Error('Google sign-in not displayed.'));
      }
      if (notification.isSkippedMoment()) {
        subject.error(new Error('Google sign-in skipped.'));
      }
    });

    // Register a one-time callback for sign-in
    google.accounts.id.initialize({
      client_id: environment.youtube.clientId,
      callback: (response: any) => {
        const profile = this.decodeJwt(response.credential);
        this.profile = profile;

        this.requestAccessToken()
          .then((accessToken) => {
            this.accessToken = accessToken;
            this.setAuthTimer(3600);
            subject.next({ profile, accessToken });
            subject.complete();
          })
          .catch((err) => subject.error(err));
      },
    });

    return subject;
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
              this.accessToken = response.access_token;
              this.setAuthTimer(response.expires_in);
              resolve(this.accessToken);
            } else {
              reject(new Error('Access token request failed.'));
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
          reject(done.error_description);
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
          reject(done.error_description);
        }
      });
    });
  }

  disableAutoSelect() {
    google.accounts.id.disableAutoSelect();
  }

  generateButton(parentElement: HTMLElement, onClick: () => void) {
    google.accounts.id.renderButton(parentElement, {
      type: 'icon',
      theme: 'outline',
      size: 'large',
      click_listener: onClick,
    });
  }

  decodeJwt(token: string): AuthorizationProfile {
    return jwtDecode<AuthorizationProfile>(token);
  }

  setAuthTimer(expiresInSeconds: number) {
    this.stopAutoSignInTimer();
    this.autoSignInTimer = this.startTimerToNextAuth(expiresInSeconds * 1000);
  }

  startTimerToNextAuth(timeInMs: number): Subscription {
    return timer(timeInMs)
      .pipe(
        switchMap(() => fromPromise(this.requestAccessToken())),
        catchError((error) => {
          console.warn('Token refresh failed, reloading page.', error);
          window.location.reload();
          return [];
        })
      )
      .subscribe();
  }

  stopAutoSignInTimer() {
    this.autoSignInTimer?.unsubscribe();
  }

  signOut(): Promise<void> {
    return Promise.all([this.revokeProfile(), this.revokeAccessToken()]).then(() => {
      this.stopAutoSignInTimer();
    });
  }

  isSignedIn(): boolean {
    return !!this.profile && !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getProfile(): AuthorizationProfile | null {
    return this.profile;
  }
}
