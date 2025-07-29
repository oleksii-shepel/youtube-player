import { Injectable } from '@angular/core';
import { Subject, createBehaviorSubject, Subscription } from '@actioncrew/streamix';
import { AboutSettings, ApiConfigSettings, AppearanceSettings, ChannelInfoSettings, PlaylistsSettings, RegionLanguageSettings, SubscriptionsSettings, UserInfoSettings } from '../interfaces/settings';
import { Storage } from '@ionic/storage-angular';

export const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'default',
  fontSize: 'medium',
  thumbnailSize: 'medium',
  autoComplete: 'chips',
  displayDescription: true,
  visibleBackdrop: true,
  displayResults: 'search',
  maxItemsPerRequest: '5',
};

export const defaultRegionLanguageSettings: RegionLanguageSettings = {
  useAutoLocation: true,
  country: null,
  language: null,
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  numberFormat: 'en-US',
  detectedCountry: null,
  detectedLanguage: null,
};

// Optional defaults for non-detailed interfaces
export const defaultUserInfoSettings: UserInfoSettings = {
  // Add fields as needed
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
  apiKey: '',
  clientId: '',
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
  userInfo: Subject<UserInfoSettings>;
  appearance: Subject<AppearanceSettings>;
  channelInfo: Subject<UserInfoSettings>;
  regionLanguage: Subject<RegionLanguageSettings>;
  playlists: Subject<PlaylistsSettings>;
  subscriptions: Subject<SubscriptionsSettings>;
  apiConfig: Subject<ApiConfigSettings>;
  about: Subject<AboutSettings>;

  subs: Subscription[] = [];

  constructor(private storage: Storage) {
    this.userInfo = createBehaviorSubject<UserInfoSettings>(defaultUserInfoSettings);
    this.appearance = createBehaviorSubject<AppearanceSettings>(defaultAppearanceSettings);
    this.channelInfo = createBehaviorSubject<ChannelInfoSettings>(defaultChannelInfoSettings);
    this.regionLanguage = createBehaviorSubject<RegionLanguageSettings>(defaultRegionLanguageSettings);
    this.playlists = createBehaviorSubject<PlaylistsSettings>(defaultPlaylistsSettings);
    this.subscriptions = createBehaviorSubject<SubscriptionsSettings>(defaultSubscriptionsSettings);
    this.apiConfig = createBehaviorSubject<ApiConfigSettings>(defaultApiConfigSettings);
    this.about = createBehaviorSubject<AboutSettings>(defaultAboutSettings);

    queueMicrotask(async () => {
      await this.storage.create();

      this.subs.push(
        this.userInfo.subscribe(value => this.storage.set('userInfo', value)),
        this.appearance.subscribe(value => this.storage.set('appearance', value)),
        this.channelInfo.subscribe(value => this.storage.set('channelInfo', value)),
        this.regionLanguage.subscribe(value => this.storage.set('regionLanguage', value)),
        this.playlists.subscribe(value => this.storage.set('playlists', value)),
        this.subscriptions.subscribe(value => this.storage.set('subscriptions', value)),
        this.apiConfig.subscribe(value => this.storage.set('apiConfig', value)),
        this.about.subscribe(value => this.storage.set('about', value))
      );

      const userInfo = await this.storage.get('userInfo');
      if (userInfo !== null && userInfo !== undefined) {
        this.userInfo.next(userInfo);
      } else {
        this.userInfo.next(defaultUserInfoSettings);
      }

      const appearance = await this.storage.get('appearance');
      if (appearance !== null && appearance !== undefined) {
        this.appearance.next(appearance);
      } else {
        this.appearance.next(defaultAppearanceSettings);
      }

      const channelInfo = await this.storage.get('channelInfo');
      if (channelInfo !== null && channelInfo !== undefined) {
        this.channelInfo.next(channelInfo);
      } else {
        this.channelInfo.next(defaultChannelInfoSettings);
      }

      const regionLanguage = await this.storage.get('regionLanguage');
      if (regionLanguage !== null && regionLanguage !== undefined) {
        this.regionLanguage.next(regionLanguage);
      } else {
        this.regionLanguage.next(defaultRegionLanguageSettings);
      }

      const playlists = await this.storage.get('playlists');
      if (playlists !== null && playlists !== undefined) {
        this.playlists.next(playlists);
      } else {
        this.playlists.next(defaultPlaylistsSettings);
      }

      const subscriptions = await this.storage.get('subscriptions');
      if (subscriptions !== null && subscriptions !== undefined) {
        this.subscriptions.next(subscriptions);
      } else {
        this.subscriptions.next(defaultSubscriptionsSettings);
      }

      const apiConfig = await this.storage.get('apiConfig');
      if (apiConfig !== null && apiConfig !== undefined) {
        this.apiConfig.next(apiConfig);
      } else {
        this.apiConfig.next(defaultApiConfigSettings);
      }

      const about = await this.storage.get('about');
      if (about !== null && about !== undefined) {
        this.about.next(about);
      } else {
        this.about.next(defaultAboutSettings);
      }
    });
  }
}
