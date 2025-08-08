import { Injectable } from '@angular/core';
import { Subject, createBehaviorSubject, Subscription } from '@actioncrew/streamix';
import { AboutSettings, AccessToken, ApiConfigSettings, AppearanceSettings, ChannelInfoSettings, PlaylistsSettings, SearchSettings, SubscriptionsSettings, UserInfoSettings } from '../interfaces/settings';
import { Storage } from '@ionic/storage-angular';
import { environment } from 'src/environments/environment';
import { CryptoService } from './crypto.service';
import { YouTubeSafeSearch } from '../interfaces/search';

export const defaultAccessToken: AccessToken = {
  accessToken: '',
  authUserIndex: '',
  expiresInSeconds: 0,
  promptMode: '',
  scopesGranted: '',
  tokenType: '',
  validFrom: 0
};

export const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'default',
  fontSize: 'medium',
  thumbnailSize: 'medium',
  autoComplete: 'chips',
  displayDescription: true,
  visibleBackdrop: true,
  displayResults: 'search',
};

export const defaultSearchSettings: SearchSettings = {
  useAutoLocation: true,
  country: null,
  language: null,
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  numberFormat: 'en-US',
  detectedCountry: null,
  detectedLanguage: null,
  maxItemsPerRequest: '5',
  safeSearch: 'moderate'
};

export const defaultUserInfoSettings: UserInfoSettings = {
  audience: '',
  authorizedParty: '',
  email: '',
  isEmailVerified: false,
  expiresAt: 0,
  lastName: '',
  firstName: '',
  issuedAt: 0,
  issuer: '',
  tokenId: '',
  fullName: '',
  validFrom: 0,
  profilePictureUrl: '',
  userId: '',
};

export const defaultChannelInfoSettings: ChannelInfoSettings = {
  name: '',
  channelId: '',
  avatar: '',
  email: '',
  subscriberCount: 0,
  videoCount: 0,
  totalViews: 0,
  joinedDate: '',
  description: '',
};

export const defaultPlaylistsSettings: PlaylistsSettings = {
  items: [],
  pages: [],
  pageIndex: 0,
  nextPageToken: null,
  prevPageToken: null,
  filter: '',
  total: 0,
  sort: { prop: 'name', dir: 'asc' },
};

export const defaultSubscriptionsSettings: SubscriptionsSettings = {
  items: [],
  pages: [],
  pageIndex: 0,
  nextPageToken: null,
  prevPageToken: null,
  filter: '',
  total: 0,
  sort: { prop: 'name', dir: 'asc' },
};

export const defaultApiConfigSettings: ApiConfigSettings = {
  apiKey: environment.youtube.apiKey,
  clientId: environment.youtube.clientId,
  clientSecret: '',
  quotaUsage: 0,
  quotaLimit: 10000,
  rateLimitEnabled: true,
  cacheEnabled: true,
  cacheDuration: 3600,
};

export const defaultAboutSettings: AboutSettings = {
  appVersion: '1.0.0',
  releaseDate: '2023-11-15',
  developerInfo: 'Tech Solutions Inc.',
  licenseInfo: 'MIT License'
};

@Injectable({ providedIn: 'root' })
export class Settings {
  accessToken: Subject<AccessToken>;
  userInfo: Subject<UserInfoSettings>;
  appearance: Subject<AppearanceSettings>;
  channelInfo: Subject<ChannelInfoSettings>; // Fixed type
  search: Subject<SearchSettings>;
  playlists: Subject<PlaylistsSettings>;
  subscriptions: Subject<SubscriptionsSettings>;
  apiConfig: Subject<ApiConfigSettings>;
  about: Subject<AboutSettings>;

  subs: Subscription[] = [];
  private initialized = false;

  constructor(private storage: Storage, private crypto: CryptoService) {
    // Initialize subjects with defaults
    this.accessToken = createBehaviorSubject<AccessToken>(defaultAccessToken);
    this.userInfo = createBehaviorSubject<UserInfoSettings>(defaultUserInfoSettings);
    this.appearance = createBehaviorSubject<AppearanceSettings>(defaultAppearanceSettings);
    this.channelInfo = createBehaviorSubject<ChannelInfoSettings>(defaultChannelInfoSettings);
    this.search = createBehaviorSubject<SearchSettings>(defaultSearchSettings);
    this.playlists = createBehaviorSubject<PlaylistsSettings>(defaultPlaylistsSettings);
    this.subscriptions = createBehaviorSubject<SubscriptionsSettings>(defaultSubscriptionsSettings);
    this.apiConfig = createBehaviorSubject<ApiConfigSettings>(defaultApiConfigSettings);
    this.about = createBehaviorSubject<AboutSettings>(defaultAboutSettings);

    queueMicrotask(() => this.initializeSettings());
  }

  private async initializeSettings(): Promise<void> {
    await this.storage.create();

    // Load all stored values first
    const storedValues = await Promise.all([
      this.storage.get('accessToken'),
      this.storage.get('userInfo'),
      this.storage.get('appearance'),
      this.storage.get('channelInfo'),
      this.storage.get('search'),
      this.storage.get('playlists'),
      this.storage.get('subscriptions'),
      this.storage.get('apiConfig'),
      this.storage.get('about')
    ]);

    const [accessToken, userInfo, appearance, channelInfo, search, playlists, subscriptions, apiConfig, about] = storedValues;

    // Update subjects with stored values (or keep defaults if no stored value)
    if (accessToken !== null && accessToken !== undefined) {
      this.accessToken.next(await this.crypto.decryptData(accessToken));
    }
    if (userInfo !== null && userInfo !== undefined) {
      this.userInfo.next(await this.crypto.decryptData(userInfo));
    }
    if (appearance !== null && appearance !== undefined) {
      this.appearance.next(appearance);
    }
    if (channelInfo !== null && channelInfo !== undefined) {
      this.channelInfo.next(channelInfo);
    }
    if (search !== null && search !== undefined) {
      this.search.next(search);
    }
    if (playlists !== null && playlists !== undefined) {
      this.playlists.next(playlists);
    }
    if (subscriptions !== null && subscriptions !== undefined) {
      this.subscriptions.next(subscriptions);
    }
    if (apiConfig !== null && apiConfig !== undefined) {
      this.apiConfig.next(apiConfig);
    }
    if (about !== null && about !== undefined) {
      this.about.next(about);
    }

    // NOW subscribe to changes to save future updates
    this.subs.push(
      this.accessToken.subscribe(value => {
        if (this.initialized) this.storage.set('accessToken', this.crypto.encryptData(value));
      }),
      this.userInfo.subscribe(value => {
        if (this.initialized) this.storage.set('userInfo', this.crypto.encryptData(value));
      }),
      this.appearance.subscribe(value => {
        if (this.initialized) this.storage.set('appearance', value);
      }),
      this.channelInfo.subscribe(value => {
        if (this.initialized) this.storage.set('channelInfo', value);
      }),
      this.search.subscribe(value => {
        if (this.initialized) this.storage.set('search', value);
      }),
      this.playlists.subscribe(value => {
        if (this.initialized) this.storage.set('playlists', value);
      }),
      this.subscriptions.subscribe(value => {
        if (this.initialized) this.storage.set('subscriptions', value);
      }),
      this.apiConfig.subscribe(value => {
        if (this.initialized) this.storage.set('apiConfig', value);
      }),
      this.about.subscribe(value => {
        if (this.initialized) this.storage.set('about', value);
      })
    );

    this.initialized = true;
  }

  // Helper method to update settings programmatically
  updateAccessToken(updates: Partial<AccessToken>): void {
    const current = this.accessToken.snappy;
    this.accessToken.next({ ...current!, ...updates });
  }

  updateUserInfo(updates: Partial<UserInfoSettings>): void {
    const current = this.userInfo.snappy;
    this.userInfo.next({ ...current!, ...updates });
  }

  updateAppearance(updates: Partial<AppearanceSettings>): void {
    const current = this.appearance.snappy;
    this.appearance.next({ ...current!, ...updates });
  }

  updateChannelInfo(updates: Partial<ChannelInfoSettings>): void {
    const current = this.channelInfo.snappy;
    this.channelInfo.next({ ...current!, ...updates });
  }

  updateSearchPreferences(updates: Partial<SearchSettings>): void {
    const current = this.search.snappy;
    this.search.next({ ...current!, ...updates });
  }

  updatePlaylists(updates: Partial<PlaylistsSettings>): void {
    const current = this.playlists.snappy;
    this.playlists.next({ ...current!, ...updates });
  }

  updateSubscriptions(updates: Partial<SubscriptionsSettings>): void {
    const current = this.subscriptions.snappy;
    this.subscriptions.next({ ...current!, ...updates });
  }

  updateApiConfig(updates: Partial<ApiConfigSettings>): void {
    const current = this.apiConfig.snappy;
    this.apiConfig.next({ ...current!, ...updates });
  }

  updateAbout(updates: Partial<AboutSettings>): void {
    const current = this.about.snappy;
    this.about.next({ ...current!, ...updates });
  }

  // Reset methods
  resetToDefaults(): void {
    this.userInfo.next(defaultUserInfoSettings);
    this.appearance.next(defaultAppearanceSettings);
    this.channelInfo.next(defaultChannelInfoSettings);
    this.search.next(defaultSearchSettings);
    this.playlists.next(defaultPlaylistsSettings);
    this.subscriptions.next(defaultSubscriptionsSettings);
    this.apiConfig.next(defaultApiConfigSettings);
    this.about.next(defaultAboutSettings);
  }

  // Cleanup method
  destroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
    this.subs = [];
  }
}
