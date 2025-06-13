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

  private authSubject: ReturnType<typeof createSubject<{ profile: AuthorizationProfile; accessToken: string }>> | null = null;

  constructor(private zone: NgZone) {
    google.accounts.id.initialize({
      client_id: environment.youtube.clientId,
      callback: (response: any) => this.handleCredentialResponse(response)
    });
  }

  generateButton(parentElement: HTMLElement) {
    google.accounts.id.renderButton(parentElement, {
      type: 'icon',
      theme: 'outline',
      size: 'large',
    });
  }

  private handleCredentialResponse(response: any) {
    try {
      const profile = this.decodeJwt(response.credential);
      this.profile = profile;

      this.requestAccessToken().then((token) => {
        this.accessToken = token;
        this.setAuthTimer(3600);

        if (this.authSubject) {
          this.authSubject.next({ profile, accessToken: token });
          this.authSubject.complete();
          this.authSubject = null;
        }
      }).catch((err) => {
        this.authSubject?.error(err);
        this.authSubject = null;
      });
    } catch (err) {
      this.authSubject?.error(err);
      this.authSubject = null;
    }
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
