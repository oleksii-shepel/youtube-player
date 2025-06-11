import { createSubject, fromPromise } from '@actioncrew/streamix';
import { Injectable, NgZone } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { from, Stream, Subscription, timer } from '@actioncrew/streamix';
import { catchError, map, retry, switchMap } from '@actioncrew/streamix';
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
  accessToken: string | null = null;
  autoSignInTimer: Subscription | null = null;
  profile: AuthorizationProfile | null = null;

  constructor(private zone: NgZone) {
  }

  loadAuth(): Stream<{profile: AuthorizationProfile, accessToken: string}> {
    let result: any = undefined;
    const subject = createSubject<AuthorizationProfile>();
    google.accounts.id.initialize({
      client_id: environment.youtube.clientId,
      callback: (response: any) => {
        result = this.requestAccessToken();
        this.profile = this.decodeJwt(response.credential);
        subject.next(this.profile);
        subject.complete();
      },
    });

    google.accounts.id.prompt();
    return subject.pipe(switchMap(() => result), map((result: string) => ({profile: this.profile, accessToken: result})));
  }

  requestAccessToken(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.zone.run(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: environment.youtube.clientId,
          scope: 'https://www.googleapis.com/auth/youtube',
          prompt: '',
          callback: (response: TokenResponse) => {
            this.accessToken = response.access_token;
            resolve(this.accessToken);
            this.setAuthTimer(response.expires_in);
          }
        });

        tokenClient.requestAccessToken();
      });
    });
  }

  revokeProfile(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      google.accounts.id.revoke(this.profile!.email, (done: any) => {
        if(done.successful) {
          this.profile = null;
          resolve();
        } else if (done.error) {
          reject(done.error_description);
        }
      });
    });
  }

  revokeAccessToken(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      google.accounts.oauth2.revoke(this.accessToken, (done: any) => {
        if(done.successful) {
          this.accessToken = null;
          resolve();
        } else if (done.error) {
          reject(done.error_description);
        }
      });
    });
  }

  disableAutoSelect() {
    google.accounts.id.disableAutoSelect();
  }

  generateButton(parentElement: HTMLElement, callback: Function) {
    google.accounts.id.renderButton(parentElement, {
      type: 'icon',
      theme: 'outline',
      size: 'large',
      click_listener: callback
    });
  }

  decodeJwt(token: string): AuthorizationProfile {
    return jwtDecode<AuthorizationProfile>(token);
  }

  setAuthTimer(expires_in: number) {
    const MILLISECOND = 1000;
    const expireTimeInMs = expires_in * MILLISECOND;
    this.stopAutoSignInTimer();
    this.autoSignInTimer = this.startTimerToNextAuth(expireTimeInMs);
  }

  startTimerToNextAuth(timeInMs: number): Subscription {
    return timer(timeInMs)
      .pipe(
        switchMap(() => retry(() => fromPromise(this.requestAccessToken()), 3)),
        catchError((error) => window.location.reload())
      )
      .subscribe();
  }

  signOut(): Promise<any> {
    return Promise.all([this.revokeProfile(), this.revokeAccessToken()]).then(() => {
      this.stopAutoSignInTimer();
    })
  }

  stopAutoSignInTimer() {
    if (this.autoSignInTimer) {
      this.autoSignInTimer.unsubscribe();
    }
  }

  isSignedIn(): boolean {
    if (this.accessToken === null || this.profile === null) {
      return false;
    }

    return true;
  }

  getAccessToken() {
    return this.accessToken;
  }

  getProfile() {
    return this.profile;
  }
}
