export type AppTheme = 'default' | 'dark' | 'light';
export type AppFontSize = 'small' | 'medium' | 'large';
export type AppThumbnailSize = 'small' | 'medium' | 'large';
export type AppDisplayResults = 'change' | 'search';
export type AppAutoCompleteMode = 'chips' | 'list';

export interface AppearanceSettings {
  theme: AppTheme;
  fontSize: AppFontSize;
  thumbnailSize: AppThumbnailSize;
  autoComplete: AppAutoCompleteMode;
  enableDescription: boolean;
  visibleBackdrop: boolean;
  displayResults: AppDisplayResults;
  maxItemsPerRequest: number;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface Country {
  code: string;
  name: string;
  nativeName: string;
}

export interface RegionAndLanguageSettings {
  useAutoLocation: boolean;
  country: Country | null;            // ISO 3166-1 alpha-2 code, e.g., 'US'
  language: Language | null;           // BCP 47 tag, e.g., 'en', 'uk'
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | string;
  timeFormat: '12h' | '24h' | string;
  numberFormat: string;              // e.g., 'en-US', 'fr-FR'
  detectedCountry: Country | null;           // From IP/location detection
  detectedLanguage: Language | null;          // From browser or location
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  videoCount: number;
  privacy: string;
  thumbnail: string;
  createdDate: string;
}

export interface Subscription {
  id: string;
  name: string;
  subscriberCount: number;
  category: string;
  thumbnail: string;
}
