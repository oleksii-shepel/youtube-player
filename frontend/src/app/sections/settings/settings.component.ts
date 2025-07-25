import { SheetConfig, SheetDirective } from 'src/app/directives/sheet/sheet.directive';
import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { firstValueFrom } from '@actioncrew/streamix';
import { Settings } from 'src/app/services/settings.service';
import { Authorization } from 'src/app/services/authorization.service';
import { Theme, ThemeService } from 'src/app/services/theme.service';
import { IonicModule } from '@ionic/angular';
import { Language, LanguageSelectModalComponent } from '../../components/language/language.component';
import { Country, CountrySelectModalComponent } from '../../components/country/country.component';
import { DirectiveModule } from 'src/app/directives';
import { GridComponent } from 'src/app/components/grid/grid.component';


export type AppTheme = 'default' | 'dark' | 'light';
export type AppFontSize = 'small' | 'medium' | 'large';
export type AppThumbnailSize = 'small' | 'medium' | 'large';
export type AppDisplayResults = 'change' | 'search';
export type AppAutoCompleteMode = 'chips' | 'list';

export enum SettingsSection {
  Appearance = 'appearance',
  UserInfo = 'user-info',
  RegionLanguage = 'region-language',
  Playlists = 'playlists',
  Subscriptions = 'subscriptions',
  ApiConfig = 'api-key',
  About = 'about',
}

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

export interface RegionAndLanguageSettings {
  useAutoLocation: boolean;
  country: Country | null;            // ISO 3166-1 alpha-2 code, e.g., 'US'
  language: Language | null;           // BCP 47 tag, e.g., 'en', 'uk'
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | string;
  timeFormat: '12h' | '24h' | string;
  numberFormat: string;              // e.g., 'en-US', 'fr-FR'
  detectedCountry: string;           // From IP/location detection
  detectedLanguage: string;          // From browser or location
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

export interface PageState<T> {
  items: T[]; // flat list of currently visible items
  pageIndex: number;
  pageSize: number;
  total: number;
  pages?: T[][]; // optional caching per page
  nextPageToken?: string | null;
  prevPageToken?: string | null;
  filter?: string;
  sort?: { prop: string; dir: 'asc' | 'desc' };
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, CountrySelectModalComponent, LanguageSelectModalComponent, GridComponent, DirectiveModule],
})
export class SettingsComponent implements OnInit {
  selectedMainSection = 'appearance';
  isApiConnected = false;
  isLoading = false;
  showApiKey = false;
  showClientSecret = false;

  appVersion = '1.0.0';
  releaseDate = '2023-11-15';
  developerInfo = 'Tech Solutions Inc.';
  licenseInfo = 'MIT License';

  userInfo = {
    name: '',
    channelId: '',
    avatar: this.getDefaultAvatarUrl('Y'),
    email: '',
    subscriberCount: 0,
    videoCount: 0,
    totalViews: 0,
    joinedDate: '',
    description: '',
  };

  appearanceSettings: AppearanceSettings = {
    theme: 'default',
    fontSize: 'medium',
    thumbnailSize: 'medium',
    autoComplete: 'chips',
    enableDescription: true,
    visibleBackdrop: true,
    displayResults: 'search',
    maxItemsPerRequest: 5,
  };

  regionLanguageSettings: RegionAndLanguageSettings = {
    useAutoLocation: false,
    country: null,
    language: null,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    numberFormat: 'en-US',
    detectedCountry: '',
    detectedLanguage: ''
  };

  isCountryModalOpen = false;
  countrySelectSheetConfig: SheetConfig = {
    breakpoints: [
      { id: 'small', height: 40 },    // Show search and few countries
      { id: 'medium', height: 70 },   // Show more countries
      { id: 'full', height: 90 }      // Full list with all features
    ],
    initialBreakpoint: 'medium',
    backdropDismiss: true,
    showBackdrop: true,
    canDismiss: true
  };

  isLanguageModalOpen = false;
  languageSelectSheetConfig: SheetConfig = {
    breakpoints: [
      { id: 'small', height: 40 },    // Show search and few countries
      { id: 'medium', height: 70 },   // Show more countries
      { id: 'full', height: 90 }      // Full list with all features
    ],
    initialBreakpoint: 'medium',
    backdropDismiss: true,
    showBackdrop: true,
    canDismiss: true
  };

  playlistState: PageState<Playlist> = {
    items: [],
    pages: [],
    pageIndex: 0,
    nextPageToken: null,
    prevPageToken: null,
    filter: '',
    pageSize: 10,
    total: 0,
  };

  subscriptionState: PageState<Subscription> = {
    items: [],
    pages: [],
    pageIndex: 0,
    nextPageToken: null,
    prevPageToken: null,
    filter: '',
    pageSize: 10,
    total: 0,
  };

  apiConfig = {
    apiKey: '',
    clientId: '',
    clientSecret: '',
    quotaUsage: 2500,
    quotaLimit: 10000,
    rateLimitEnabled: true,
    cacheEnabled: true,
    cacheDuration: 3600,
  };

  country!: HTMLIonModalElement;
  language!: HTMLIonModalElement;

  @ViewChild(SheetDirective) sheetDirective!: SheetDirective;
  @ViewChild(GridComponent) gridComponent!: GridComponent;

  constructor(
    private router: Router,
    private storage: Storage,
    private settings: Settings,
    private authorization: Authorization,
    private theme: ThemeService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.applyTheme();
    await this.checkApiConnection();
    this.loadUserProfile();
    await this.loadPlaylists();
    await this.loadSubscriptions();
  }

  async openCountryModal() {
    this.isCountryModalOpen = true; // Show the wrapper div
    // Use setTimeout to ensure the DOM element is rendered before calling present
    await new Promise(resolve => setTimeout(resolve, 0));
    this.sheetDirective.present();
  }

  onCloseCountryModal() {
    this.sheetDirective.dismiss(); // smoothly closes modal if SheetDirective is used
    this.isCountryModalOpen = false;
  }

  onCancelCountryModal() {
    console.log('Country selection cancelled');
    this.sheetDirective.dismiss();
    this.isCountryModalOpen = false;
  }

  onSelectCountry(country: any) {
    this.regionLanguageSettings.country = country;
    this.saveRegionLanguageSettings(); // optional: persist setting
    this.sheetDirective.dismiss();
    this.isCountryModalOpen = false;
  }

  async openLanguageModal() {
    this.isLanguageModalOpen = true; // Show the wrapper div
    // Use setTimeout to ensure the DOM element is rendered before calling present
    await new Promise(resolve => setTimeout(resolve, 0));
    this.sheetDirective.present();
  }

  onCloseLanguageModal() {
    this.sheetDirective.dismiss(); // smoothly closes modal if SheetDirective is used
    this.isLanguageModalOpen = false;
  }

  onCancelLanguageModal() {
    console.log('Country selection cancelled');
    this.sheetDirective.dismiss();
    this.isLanguageModalOpen = false;
  }

  onSelectLanguage(language: any) {
    this.regionLanguageSettings.language = language;
    this.saveRegionLanguageSettings(); // optional: persist setting
    this.sheetDirective.dismiss();
    this.isLanguageModalOpen = false;
  }

  // Ionic lifecycle, if used
  async ionViewWillEnter() {
    await this.loadSavedSettings();
  }

  get playlistCount(): number {
    return this.playlistState.items.length;
  }

  get subscriptionCount(): number {
    return this.subscriptionState.items.length;
  }

  loadUserProfile() {
    const profile = this.authorization.getProfile();
    if (profile) {
      this.userInfo = {
        ...this.userInfo,
        name: profile.name,
        email: profile.email,
        avatar: profile.picture || this.getDefaultAvatarUrl(profile.name),
      };
    }
  }

  async checkApiConnection() {
    if (this.authorization.isSignedIn()) {
      this.isApiConnected = true;
      return;
    }
    if (!this.apiConfig.apiKey) {
      this.isApiConnected = false;
      return;
    }
    this.isLoading = true;
    try {
      this.isApiConnected = true;
      await this.loadUserData();
    } catch (error) {
      console.error('API Connection Error:', error);
      this.isApiConnected = false;
    } finally {
      this.isLoading = false;
    }
  }

  async loadUserData() {
    this.isLoading = true;
    try {
      const authProfile = this.authorization.getProfile();
      if (authProfile) {
        this.userInfo = {
          ...this.userInfo,
          name: authProfile.name,
          email: authProfile.email,
          avatar: authProfile.picture || this.getDefaultAvatarUrl(authProfile.name),
        };
      }
      if (this.isApiConnected) {
        const channelResponse: any = await firstValueFrom(this.settings.getMyChannel());
        const channel = channelResponse.items[0];
        this.userInfo = {
          ...this.userInfo,
          channelId: channel.id,
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount),
          totalViews: parseInt(channel.statistics.viewCount),
          joinedDate: new Date(channel.snippet.publishedAt).toLocaleDateString(),
          description: channel.snippet.description,
        };
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getDefaultAvatarUrl(name: string): string {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100" height="100" fill="#555"/>
        <text x="50%" y="55%" font-size="40" text-anchor="middle" fill="#fff" font-family="Arial" dy=".3em">${initials}</text>
      </svg>`;
    // Properly encode base64 of SVG
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  async loadPlaylists(pageToken?: string): Promise<{ items: Playlist[]; nextPageToken?: string }> {
    if (!this.isApiConnected) {
      return { items: this.playlistState.items, nextPageToken: '' };
    }
    this.isLoading = true;
    try {
      const response: any = await firstValueFrom(this.settings.listPlaylistsPaginated(pageToken));
      const items = response.items.map((item: any) => ({
        id: item.id,
        name: item.snippet.title,
        description: item.snippet.description,
        videoCount: 0, // Additional API call needed for actual count
        privacy: item.status.privacyStatus,
        thumbnail: item.snippet.thumbnails?.default?.url || 'assets/playlist-default.jpg',
        createdDate: new Date(item.snippet.publishedAt).toLocaleDateString(),
      }));
      this.playlistState = {
        ...this.playlistState,
        items,
        pages: pageToken ? [...(this.playlistState.pages || []), items] : [items],
        pageIndex: pageToken ? this.playlistState.pageIndex + 1 : 0,
        nextPageToken: response.nextPageToken || null,
        prevPageToken: pageToken || null,
      };
      return { items, nextPageToken: response.nextPageToken };
    } catch (error) {
      console.error('Error loading playlists:', error);
      return { items: this.playlistState.items, nextPageToken: '' };
    } finally {
      this.isLoading = false;
    }
  }

  createPlaylist(playlistData: any) {
    // The playlistData will contain form data like { name: 'New Playlist' }
    console.log('Creating playlist:', playlistData);

    // If you have existing createPlaylist logic, adapt it:
    const newPlaylist = {
      id: Date.now(), // or your existing ID logic
      name: playlistData.name || 'Untitled Playlist',
      videoCount: 0,
      createdAt: new Date().toISOString(),
      ...playlistData
    };

    // Call your existing service/state management
    // this.playlistService.create(newPlaylist);
    // OR update playlistState directly
    // OR let the grid handle it locally if no service integration needed
  }

  onEditPlaylist(playlist: any) {
    console.log('Editing playlist:', playlist);
    // Handle playlist editing - the playlist object contains all current values
    // this.playlistService.update(playlist.id, playlist);
  }

  onDeletePlaylist(playlist: any) {
    console.log('Deleting playlist:', playlist);
    // Handle playlist deletion
    // this.playlistService.delete(playlist.id);
  }

  // If you need to programmatically update the grid:
  updatePlaylistData(newData: any[]) {
    this.gridComponent.updateData(newData);
  }

  addPlaylistToGrid(playlist: any) {
    this.gridComponent.addItem(playlist);
  }

  async loadSubscriptions(pageToken?: string): Promise<{ items: Subscription[]; nextPageToken?: string }> {
    if (!this.isApiConnected) {
      return { items: this.subscriptionState.items, nextPageToken: '' };
    }
    this.isLoading = true;
    try {
      const response: any = await firstValueFrom(this.settings.listSubscriptionsPaginated(pageToken));
      const items = response.items.map((item: any) => ({
        id: item.snippet.resourceId.channelId,
        name: item.snippet.title,
        subscriberCount: 0, // Additional API call needed for actual count
        category: '', // Not directly available
        thumbnail: item.snippet.thumbnails?.default?.url || 'assets/channel-default.jpg',
      }));
      this.subscriptionState = {
        ...this.subscriptionState,
        items,
        pages: pageToken ? [...(this.subscriptionState.pages || []), items] : [items],
        pageIndex: pageToken ? this.subscriptionState.pageIndex + 1 : 0,
        nextPageToken: response.nextPageToken || null,
        prevPageToken: pageToken || null,
      };
      return { items, nextPageToken: response.nextPageToken };
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      return { items: this.subscriptionState.items, nextPageToken: '' };
    } finally {
      this.isLoading = false;
    }
  }

  async unsubscribe(subscription: Subscription) {
    try {
      await firstValueFrom(this.settings.unsubscribe(subscription.id));
      const filteredSubs = this.subscriptionState.items.filter((s) => s.id !== subscription.id);
      this.subscriptionState = {
        ...this.subscriptionState,
        items: filteredSubs,
        pages: [filteredSubs],
        pageIndex: 0,
        nextPageToken: null,
        prevPageToken: null,
      };
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }

  viewChannel(subscription: Subscription) {
    console.log('View channel:', subscription);
    // TODO: implement channel viewing logic
  }

  async loadSavedSettings() {
    const savedApiConfig = await this.storage.get('youtubeApiConfig');
    if (savedApiConfig) {
      this.apiConfig = { ...this.apiConfig, ...savedApiConfig };
    }
    const savedAppearance = await this.storage.get('appearanceSettings');
    if (savedAppearance) {
      this.appearanceSettings = { ...this.appearanceSettings, ...savedAppearance };
    }
    const savedRegionLanguage = await this.storage.get('regionLanguageSettings');
    if (savedRegionLanguage) {
      this.regionLanguageSettings = { ...this.regionLanguageSettings, ...savedRegionLanguage };
    }
  }

  selectMainSection(section: string) {
    this.selectedMainSection = section;
    this.storage.set('lastViewedSection', section).catch((err) => {
      console.error('Error saving last viewed section:', err);
    });
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(300);
    }
  }

  getSectionTitle(): string {
    const sectionTitles: { [key: string]: string } = {
      'channel-info': 'Channel Info',
      appearance: 'Theme Settings',
      'region-language': 'Region & Language',
      playlists: 'Playlists Management',
      subscriptions: 'Subscriptions',
      'api-key': 'API Configuration',
      about: 'About',
    };
    return sectionTitles[this.selectedMainSection] || 'YouTube Data API Settings';
  }

  applyTheme() {
    this.theme.initTheme();
  }

  onThemeChange() {
    this.theme.setTheme(this.appearanceSettings.theme as Theme);
    this.saveAppearanceSettings();
  }

  async saveAppearanceSettings() {
    await this.storage.set('appearanceSettings', this.appearanceSettings);
  }

  async saveRegionLanguageSettings() {
    await this.storage.set('regionLanguageSettings', this.regionLanguageSettings);
  }

  async saveApiConfig() {
    await this.storage.set('youtubeApiConfig', this.apiConfig);
    this.checkApiConnection();
  }

  async resetApiConfig() {
    this.apiConfig = {
      apiKey: '',
      clientId: '',
      clientSecret: '',
      quotaUsage: 0,
      quotaLimit: 10000,
      rateLimitEnabled: true,
      cacheEnabled: true,
      cacheDuration: 3600,
    };
    await this.storage.remove('youtubeApiConfig');
    this.isApiConnected = false;
  }

  async testApiConnection() {
    if (!this.apiConfig.apiKey) {
      this.isApiConnected = false;
      return;
    }
    this.isLoading = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.isApiConnected = true;
      await this.loadUserData();
    } catch (error) {
      console.error('API Connection Error:', error);
      this.isApiConnected = false;
    } finally {
      this.isLoading = false;
    }
  }

  refreshData() {
    if (!this.isApiConnected) return;
    this.isLoading = true;
    this.loadUserData().finally(() => {
      this.isLoading = false;
    });
  }

  toggleApiKeyVisibility() {
    this.showApiKey = !this.showApiKey;
  }

  toggleClientSecretVisibility() {
    this.showClientSecret = !this.showClientSecret;
  }

  getCategoryColor(category: string): string {
    switch (category.toLowerCase()) {
      case 'technology':
        return 'primary';
      case 'education':
        return 'accent';
      case 'gaming':
        return 'warn';
      default:
        return '';
    }
  }

  getPrivacyColor(privacy: string): string {
    switch (privacy) {
      case 'public':
        return 'success';
      case 'private':
        return 'danger';
      case 'unlisted':
        return 'warning';
      default:
        return 'medium';
    }
  }

  formatNumber(num: number): string {
    return num.toLocaleString(this.regionLanguageSettings.numberFormat);
  }

  async onAutoLocationToggle() {
    if (this.regionLanguageSettings.useAutoLocation) {
     const { countryName, languageName } = await this.settings.detectRegionAndLanguage();
     this.regionLanguageSettings.detectedCountry = countryName;
     this.regionLanguageSettings.detectedLanguage = languageName;
    }
    this.saveRegionLanguageSettings();
  }

  getQuotaPercentage(): number {
    return Math.round((this.apiConfig.quotaUsage / this.apiConfig.quotaLimit) * 100);
  }

  goBackToApp() {
    this.router.navigate(['/app']);
  }

  openWebsite() {
    window.open('https://yourwebsite.com', '_blank');
  }

  openPrivacyPolicy() {
    window.open('https://yourwebsite.com/privacy', '_blank');
  }
}
