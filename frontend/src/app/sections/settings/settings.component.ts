// src/app/settings/youtube-api-settings.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-settings',
  template: `
    <!-- Existing template remains unchanged -->
  `,
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class SettingsPage implements OnInit {
  selectedMainSection: string = 'user-info';
  isApiConnected: boolean = false;
  isLoading: boolean = false;
  showApiKey: boolean = false;
  showClientSecret: boolean = false;
  subscriptionFilter: string = '';
  filteredSubscriptions: any[] = [];

  // User Information
  userInfo = {
    name: 'Tech Creator',
    channelId: 'UC1234567890abcdef',
    avatar: 'assets/youtube-default-avatar.png',
    email: 'creator@example.com',
    subscriberCount: 125000,
    videoCount: 47,
    totalViews: 1250000,
    joinedDate: 'Jan 15, 2020',
    description: 'Technology and programming content creator'
  };

  // Appearance Settings
  appearanceSettings = {
    theme: 'default',
    accentColor: '#ff0000',
    compactMode: false,
    showThumbnails: true,
    itemsPerPage: 25,
    autoplay: true
  };

  // Region & Language Settings
  regionLanguageSettings = {
    country: 'US',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    numberFormat: 'en-US'
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
      createdDate: 'Mar 2023'
    },
    {
      id: 'PL2',
      name: 'React Development',
      description: 'Modern React development techniques',
      videoCount: 18,
      privacy: 'public',
      thumbnail: 'assets/playlist-2.jpg',
      createdDate: 'Jun 2023'
    },
    {
      id: 'PL3',
      name: 'Personal Projects',
      description: 'My coding side projects',
      videoCount: 8,
      privacy: 'private',
      thumbnail: 'assets/playlist-3.jpg',
      createdDate: 'Aug 2023'
    }
  ];
  playlistCount: number = 3;

  // Subscriptions Data
  subscriptions = [
    {
      id: 'UC1',
      name: 'Tech Channel Pro',
      subscriberCount: 2100000,
      category: 'Technology',
      thumbnail: 'assets/channel-1.jpg'
    },
    {
      id: 'UC2',
      name: 'Code Academy',
      subscriberCount: 5800000,
      category: 'Education',
      thumbnail: 'assets/channel-2.jpg'
    },
    {
      id: 'UC3',
      name: 'Dev Talk',
      subscriberCount: 987000,
      category: 'Technology',
      thumbnail: 'assets/channel-3.jpg'
    }
  ];
  subscriptionCount: number = 3;

  // API Configuration
  apiConfig = {
    apiKey: '',
    clientId: '',
    clientSecret: '',
    quotaUsage: 2500,
    quotaLimit: 10000,
    rateLimitEnabled: true,
    cacheEnabled: true,
    cacheDuration: 3600
  };

  constructor(private router: Router, private storage: Storage) {
    this.filteredSubscriptions = [...this.subscriptions];
  }

  async ngOnInit() {
    await this.storage.create();
    this.selectedMainSection = 'user-info';
    await this.loadSavedSettings();
    this.applyTheme();
    this.checkApiConnection();
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
      this.appearanceSettings = { ...this.appearanceSettings, ...savedAppearance };
    }

    // Load region/language settings
    const savedRegionLanguage = await this.storage.get('regionLanguageSettings');
    if (savedRegionLanguage) {
      this.regionLanguageSettings = { ...this.regionLanguageSettings, ...savedRegionLanguage };
    }
  }

  applyTheme() {
    document.body.setAttribute('data-theme', this.appearanceSettings.theme);
  }

  onThemeChange() {
    this.applyTheme();
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
      cacheDuration: 3600
    };
    await this.storage.remove('youtubeApiConfig');
    this.isApiConnected = false;
  }

  checkApiConnection() {
    this.isApiConnected = !!this.apiConfig.apiKey;
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
      await new Promise(resolve => setTimeout(resolve, 1000));

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
    if (!this.isApiConnected) return;

    this.isLoading = true;
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // In a real app, you would fetch actual user data here
      this.userInfo = {
        name: 'Tech Creator',
        channelId: 'UC1234567890abcdef',
        avatar: 'assets/youtube-default-avatar.png',
        email: 'creator@example.com',
        subscriberCount: 125000,
        videoCount: 47,
        totalViews: 1250000,
        joinedDate: 'Jan 15, 2020',
        description: 'Technology and programming content creator'
      };

      await this.loadPlaylists();
      await this.loadSubscriptions();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadPlaylists() {
    if (!this.isApiConnected) return;

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app, you would fetch actual playlists
      this.playlists = [
        {
          id: 'PL1',
          name: 'JavaScript Tutorials',
          description: 'Complete JavaScript programming course',
          videoCount: 25,
          privacy: 'public',
          thumbnail: 'assets/playlist-1.jpg',
          createdDate: 'Mar 2023'
        },
        // ... other playlists ...
      ];
      this.playlistCount = this.playlists.length;
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  }

  async loadSubscriptions() {
    if (!this.isApiConnected) return;

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app, you would fetch actual subscriptions
      this.subscriptions = [
        {
          id: 'UC1',
          name: 'Tech Channel Pro',
          subscriberCount: 2100000,
          category: 'Technology',
          thumbnail: 'assets/channel-1.jpg'
        },
        // ... other subscriptions ...
      ];
      this.subscriptionCount = this.subscriptions.length;
      this.filteredSubscriptions = [...this.subscriptions];
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  }

  filterSubscriptions() {
    if (!this.subscriptionFilter) {
      this.filteredSubscriptions = [...this.subscriptions];
      return;
    }

    const filter = this.subscriptionFilter.toLowerCase();
    this.filteredSubscriptions = this.subscriptions.filter(sub =>
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

  getPrivacyColor(privacy: string): string {
    switch (privacy) {
      case 'public': return 'success';
      case 'private': return 'danger';
      case 'unlisted': return 'warning';
      default: return 'medium';
    }
  }

  formatNumber(num: number): string {
    return num.toLocaleString(this.regionLanguageSettings.numberFormat);
  }

  getQuotaPercentage(): number {
    return Math.round((this.apiConfig.quotaUsage / this.apiConfig.quotaLimit) * 100);
  }

  createPlaylist() {
    // In a real app, implement playlist creation logic
    console.log('Create new playlist');
  }

  editPlaylist(playlist: any) {
    // In a real app, implement playlist editing logic
    console.log('Edit playlist:', playlist);
  }

  deletePlaylist(playlist: any) {
    // In a real app, implement playlist deletion logic
    console.log('Delete playlist:', playlist);
    this.playlists = this.playlists.filter(p => p.id !== playlist.id);
    this.playlistCount = this.playlists.length;
  }

  viewChannel(channel: any) {
    // In a real app, implement channel viewing logic
    console.log('View channel:', channel);
  }

  unsubscribe(channel: any) {
    // In a real app, implement unsubscribe logic
    console.log('Unsubscribe from channel:', channel);
    this.subscriptions = this.subscriptions.filter(s => s.id !== channel.id);
    this.subscriptionCount = this.subscriptions.length;
    this.filterSubscriptions();
  }

  goBackToApp() {
    this.router.navigate(['/home']);
  }
}
