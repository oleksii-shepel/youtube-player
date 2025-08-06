export interface AccessToken {
  accessToken: string;
  authUserIndex: string;     // Google returns this as a string index (e.g. '0')
  expiresInSeconds: number;
  promptMode: string;        // e.g., 'consent', 'none'
  scopesGranted: string;     // space-separated OAuth scopes
  tokenType: string;         // usually 'Bearer'
}

export interface UserInfoSettings {
  audience: string;
  authorizedParty: string;
  email: string;
  isEmailVerified: boolean;
  expiresAt: number;
  lastName: string;
  firstName: string;
  issuedAt: number;
  issuer: string;
  tokenId: string;
  fullName: string;
  validFrom: number;
  profilePictureUrl: string;
  userId: string;
}

export type AppTheme = 'default' | 'dark' | 'light';
export type AppFontSize = 'small' | 'medium' | 'large';
export type AppThumbnailSize = 'small' | 'medium' | 'large';
export type AppDisplayResults = 'change' | 'search';
export type AppAutoCompleteMode = 'chips' | 'dropdown';

export interface AppearanceSettings {
  theme: AppTheme;
  fontSize: AppFontSize;
  thumbnailSize: AppThumbnailSize;
  autoComplete: AppAutoCompleteMode;
  displayDescription: boolean;
  visibleBackdrop: boolean;
  displayResults: AppDisplayResults;
  maxItemsPerRequest: string;
};

export interface ChannelInfoSettings {
  name: string,
  channelId: string,
  avatar: string,
  email: string,
  subscriberCount: number,
  videoCount: number,
  totalViews: number,
  joinedDate: string,
  description: string,
};

export interface Language {
  code: string;
  name: string;
  nativeName: string;
};

export interface Country {
  code: string;
  name: string;
  nativeName: string;
};

export interface RegionLanguageSettings {
  useAutoLocation: boolean;
  country: Country | null;            // ISO 3166-1 alpha-2 code, e.g., 'US'
  language: Language | null;           // BCP 47 tag, e.g., 'en', 'uk'
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | string;
  timeFormat: '12h' | '24h' | string;
  numberFormat: string;              // e.g., 'en-US', 'fr-FR'
  detectedCountry: Country | null;           // From IP/location detection
  detectedLanguage: Language | null;          // From browser or location
};

export interface Playlist {
  id: string;
  name: string;
  description: string;
  videoCount: number;
  privacy: string;
  thumbnail: string;
  createdDate: string;
};

export interface PlaylistsSettings {
  items: Playlist[];
  pages?: Playlist[][];
  pageIndex: number;
  nextPageToken?: string | null;
  prevPageToken?: string | null;
  filter?: string;
  total?: number;
  sort?: { prop: string; dir: 'asc' | 'desc' };
};

export interface Subscription {
  id: string;
  name: string;
  subscriberCount: number;
  category: string;
  thumbnail: string;
};

export interface SubscriptionsSettings {
  items: Subscription[];
  pages?: Subscription[][];
  pageIndex: number;
  nextPageToken?: string | null;
  prevPageToken?: string | null;
  filter?: string;
  total?: number;
  sort?: { prop: string; dir: 'asc' | 'desc' };
};

export interface ApiConfigSettings {
  apiKey: string,
  clientId: string,
  clientSecret: string,
  quotaUsage: number,
  quotaLimit: number,
  rateLimitEnabled: boolean,
  cacheEnabled: boolean,
  cacheDuration: number,
};

export interface AboutSettings {
  appVersion: string;
  releaseDate: string;
  developerInfo: string;
  licenseInfo: string;
};
