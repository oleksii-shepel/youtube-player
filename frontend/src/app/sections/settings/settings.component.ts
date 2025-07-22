import { Authorization } from './../../services/authorization.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { IonicStorageModule, Storage } from '@ionic/storage-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Settings } from 'src/app/services/settings.service';
import { firstValueFrom } from '@actioncrew/streamix';
import { Theme, ThemeService } from 'src/app/services/theme.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

export type AppTheme = 'default' | 'dark' | 'light'; // 'default' will now map to system preference
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

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, IonicStorageModule, NgxDatatableModule],
})
export class SettingsComponent implements OnInit {
  selectedMainSection: string = 'appearance';
  isApiConnected: boolean = false;
  isLoading: boolean = false;
  showApiKey: boolean = false;
  showClientSecret: boolean = false;
  subscriptionFilter: string = '';
  filteredSubscriptions: any[] = [];

  appVersion = '1.0.0';
  releaseDate = '2023-11-15';
  developerInfo = 'Tech Solutions Inc.';
  licenseInfo = 'MIT License';

  // User Information
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

  // Appearance Settings
  appearanceSettings = {
    theme: 'default',
    fontSize: 'medium',
    thumbnailSize: 'medium',
    autoComplete: 'chips',
    enableDescription: true,
    visibleBackdrop: true,
    displayResults: 'search',
    maxItemsPerRequest: '5'
  };

  // Region & Language Settings
  regionLanguageSettings = {
    country: 'US',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    numberFormat: 'en-US',
  };

  // Playlists Data
  playlists = [
    {
      id: 'PL1',
      name: 'JavaScript Tutorials',
      description: 'Complete JavaScript programming course',
      videoCount: 25,
      privacy: 'public',
      thumbnail: 'assets/playlist-1.jpg',
      createdDate: 'Mar 2023',
    },
    {
      id: 'PL2',
      name: 'React Development',
      description: 'Modern React development techniques',
      videoCount: 18,
      privacy: 'public',
      thumbnail: 'assets/playlist-2.jpg',
      createdDate: 'Jun 2023',
    },
    {
      id: 'PL3',
      name: 'Personal Projects',
      description: 'My coding side projects',
      videoCount: 8,
      privacy: 'private',
      thumbnail: 'assets/playlist-3.jpg',
      createdDate: 'Aug 2023',
    },
  ];

  playlistCount: number = 3;
  playlistColumns = [];
  playlistPageSize = 10;
  playlistPageOffset = 0;
  paginatedPlaylists: any[] = [];

  // Subscriptions Data
  subscriptions = [
    {
      id: 'UC1',
      name: 'Tech Channel Pro',
      subscriberCount: 2100000,
      category: 'Technology',
      thumbnail: 'assets/channel-1.jpg',
    },
    {
      id: 'UC2',
      name: 'Code Academy',
      subscriberCount: 5800000,
      category: 'Education',
      thumbnail: 'assets/channel-2.jpg',
    },
    {
      id: 'UC3',
      name: 'Dev Talk',
      subscriberCount: 987000,
      category: 'Technology',
      thumbnail: 'assets/channel-3.jpg',
    },
  ];
  subscriptionCount: number = 3;
  subscriptionColumns = [];
  subscriptionPageSize = 10;
  subscriptionPageOffset = 0;
  paginatedSubscriptions: any[] = [];

  // API Configuration
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

  constructor(
    private router: Router,
    private storage: Storage,
    private settings: Settings,
    private authorization: Authorization,
    private theme: ThemeService
  ) {
    this.filteredSubscriptions = [...this.subscriptions];
  }

  async ngOnInit() {
    await this.storage.create();
    this.applyTheme();
    await this.checkApiConnection();
    this.loadUserProfile();
  }

  async ionViewWillEnter() {
    await this.loadSavedSettings();
  }

  // Load user profile from Authorization service
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
    // First check if we have OAuth access
    if (this.authorization.isSignedIn()) {
      this.isApiConnected = true;
      return;
    }

    // Fall back to API key check
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

  // Updated loadUserData to combine Authorization profile with YouTube API data
  async loadUserData() {
    this.isLoading = true;
    try {
      // Get profile from Authorization service if available
      const authProfile = this.authorization.getProfile();
      if (authProfile) {
        this.userInfo = {
          ...this.userInfo,
          name: authProfile.name,
          email: authProfile.email,
          avatar:
            authProfile.picture || this.getDefaultAvatarUrl(authProfile.name),
        };
      }

      // Only fetch YouTube-specific data if we have an API connection
      if (this.isApiConnected) {
        const channelResponse = await firstValueFrom(
          this.settings.getMyChannel()
        );
        const channel = channelResponse.items[0];

        this.userInfo = {
          ...this.userInfo,
          channelId: channel.id,
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount),
          totalViews: parseInt(channel.statistics.viewCount),
          joinedDate: new Date(
            channel.snippet.publishedAt
          ).toLocaleDateString(),
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
      </svg>
    `;

    const encoded = btoa(
      encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );

    return `data:image/svg+xml;base64,${encoded}`;
  }

  // Updated loadPlaylists to use Settings service
  async loadPlaylists() {
    if (!this.isApiConnected) return;

    this.paginatePlaylists();

    try {
      const playlistsResponse: any = await firstValueFrom(
        this.settings.listPlaylistsPaginated()
      );
      this.playlists = playlistsResponse.items.map((item: any) => ({
        id: item.id,
        name: item.snippet.title,
        description: item.snippet.description,
        videoCount: 0, // Would need another API call to get this
        privacy: item.status.privacyStatus,
        thumbnail:
          item.snippet.thumbnails?.default?.url ||
          'assets/playlist-default.jpg',
        createdDate: new Date(item.snippet.publishedAt).toLocaleDateString(),
      }));
      this.playlistCount = this.playlists.length;
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  }

  // Updated loadSubscriptions to use Settings service
  async loadSubscriptions() {
    if (!this.isApiConnected) return;

    this.paginateSubscriptions();

    try {
      const subscriptionsResponse = await firstValueFrom(
        this.settings.listSubscriptions()
      );
      this.subscriptions = subscriptionsResponse.items.map((item: any) => ({
        id: item.snippet.resourceId.channelId,
        name: item.snippet.title,
        subscriberCount: 0, // Would need another API call to get this
        category: '', // Not directly available in subscription response
        thumbnail:
          item.snippet.thumbnails?.default?.url || 'assets/channel-default.jpg',
      }));
      this.subscriptionCount = this.subscriptions.length;
      this.filteredSubscriptions = [...this.subscriptions];
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  }

  // Updated createPlaylist to use Settings service
  async createPlaylist() {
    if (!this.isApiConnected) return;

    try {
      // In a real app, you'd get these values from a form
      const title = 'New Playlist';
      const description = 'Playlist created from the app';
      const privacyStatus = 'private';

      const response = await firstValueFrom(
        this.settings.createPlaylist(title, description, privacyStatus)
      );

      // Add the new playlist to our list
      this.playlists.unshift({
        id: response.id,
        name: response.snippet.title,
        description: response.snippet.description,
        videoCount: 0,
        privacy: response.status.privacyStatus,
        thumbnail:
          response.snippet.thumbnails?.default?.url ||
          'assets/playlist-default.jpg',
        createdDate: new Date(
          response.snippet.publishedAt
        ).toLocaleDateString(),
      });
      this.playlistCount = this.playlists.length;
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  }

  // Updated deletePlaylist to use Settings service
  async deletePlaylist(playlist: any) {
    try {
      await firstValueFrom(this.settings.deletePlaylist(playlist.id));
      this.playlists = this.playlists.filter((p) => p.id !== playlist.id);
      this.playlistCount = this.playlists.length;
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  }

  // Updated unsubscribe to use Settings service
  async unsubscribe(channel: any) {
    try {
      // Note: This assumes the subscriptionId is the same as channelId
      // In a real app, you'd need to find the actual subscriptionId
      await firstValueFrom(this.settings.unsubscribe(channel.id));
      this.subscriptions = this.subscriptions.filter(
        (s) => s.id !== channel.id
      );
      this.subscriptionCount = this.subscriptions.length;
      this.filterSubscriptions();
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }

  async loadSavedSettings() {
    // Load API config
    const savedApiConfig = await this.storage.get('youtubeApiConfig');
    if (savedApiConfig) {
      this.apiConfig = { ...this.apiConfig, ...savedApiConfig };
    }

    // Load appearance settings
    const savedAppearance = await this.storage.get('appearanceSettings');
    if (savedAppearance) {
      this.appearanceSettings = {
        ...this.appearanceSettings,
        ...savedAppearance,
      };
    }

    // Load region/language settings
    const savedRegionLanguage = await this.storage.get(
      'regionLanguageSettings'
    );
    if (savedRegionLanguage) {
      this.regionLanguageSettings = {
        ...this.regionLanguageSettings,
        ...savedRegionLanguage,
      };
    }
  }

  selectMainSection(section: string) {
    this.selectedMainSection = section;

    // Optional: Save the last viewed section to storage
    this.storage.set('lastViewedSection', section).catch((err) => {
      console.error('Error saving last viewed section:', err);
    });

    // Optional: Scroll to top when changing sections
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(300);
    }
  }

  getSectionTitle(): string {
    const sectionTitles: { [key: string]: string } = {
      'user-info': 'User Details',
      appearance: 'Theme Settings',
      'region-language': 'Region & Language',
      playlists: 'Playlists Management',
      subscriptions: 'Subscriptions',
      'api-key': 'API Configuration',
      about: 'About',
    };

    return (
      sectionTitles[this.selectedMainSection] || 'YouTube Data API Settings'
    );
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
    await this.storage.set(
      'regionLanguageSettings',
      this.regionLanguageSettings
    );
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
      // In a real app, you would make an actual API call here
      // For demo purposes, we'll simulate a successful connection
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

  filterSubscriptions() {
    if (!this.subscriptionFilter) {
      this.filteredSubscriptions = [...this.subscriptions];
      return;
    }

    const filter = this.subscriptionFilter.toLowerCase();
    this.filteredSubscriptions = this.subscriptions.filter(
      (sub) =>
        sub.name.toLowerCase().includes(filter) ||
        sub.category.toLowerCase().includes(filter)
    );
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

  getQuotaPercentage(): number {
    return Math.round(
      (this.apiConfig.quotaUsage / this.apiConfig.quotaLimit) * 100
    );
  }

  editPlaylist(playlist: any) {
    // In a real app, implement playlist editing logic
    console.log('Edit playlist:', playlist);
  }

  paginatePlaylists() {
    const start = this.playlistPageOffset * this.playlistPageSize;
    this.paginatedPlaylists = this.playlists.slice(start, start + this.playlistPageSize);
  }

  // Re-run when subscriptions are filtered
  paginateSubscriptions() {
    const start = this.subscriptionPageOffset * this.subscriptionPageSize;
    this.paginatedSubscriptions = this.filteredSubscriptions.slice(start, start + this.subscriptionPageSize);
  }

  // Page change handlers
  onPlaylistPage({ offset }: { offset: number }) {
    this.playlistPageOffset = offset;
    this.paginatePlaylists();
  }

  onSubscriptionPage({ offset }: { offset: number }) {
    this.subscriptionPageOffset = offset;
    this.paginateSubscriptions();
  }

  viewChannel(channel: any) {
    // In a real app, implement channel viewing logic
    console.log('View channel:', channel);
  }

  goBackToApp() {
    this.router.navigate(['/app']);
  }

  openWebsite() {
    // Implement website opening logic
    window.open('https://yourwebsite.com', '_blank');
  }

  openPrivacyPolicy() {
    // Implement privacy policy opening logic
    window.open('https://yourwebsite.com/privacy', '_blank');
  }
}
