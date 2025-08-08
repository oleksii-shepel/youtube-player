import { SheetConfig, SheetDirective } from 'src/app/directives/sheet/sheet.directive';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from '@actioncrew/streamix';
import { Helper } from 'src/app/services/helper.service';
import { Authorization } from 'src/app/services/authorization.service';
import { Theme, ThemeService } from 'src/app/services/theme.service';
import { IonicModule } from '@ionic/angular';
import { CountryLanguageSelection, CountrySelectModalComponent } from '../../components/country/country.component';
import { DirectiveModule } from 'src/app/directives';
import { GridComponent } from 'src/app/components/grid/grid.component';
import { AboutSettings, ApiConfigSettings, AppearanceSettings, ChannelInfoSettings, Playlist as PlaylistEntity, PlaylistsSettings, SearchSettings as SearchSettings, Subscription as SubscriptionEntity, SubscriptionsSettings, UserInfoSettings } from 'src/app/interfaces/settings';
import { Settings } from 'src/app/services/settings.service';
import { SheetService } from 'src/app/services/sheet.service';

export enum SettingsSection {
  Appearance = 'appearance',
  UserInfo = 'user-info',
  Search = 'search',
  Playlists = 'playlists',
  Subscriptions = 'subscriptions',
  ApiConfig = 'api-key',
  About = 'about',
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
  imports: [CommonModule, FormsModule, IonicModule, GridComponent, DirectiveModule],
})
export class SettingsChapter implements OnInit {
  selectedMainSection = 'appearance';

  userInfoSettings!: UserInfoSettings;
  appearanceSettings!: AppearanceSettings;
  searchSettings!: SearchSettings;
  channelInfoSettings!: ChannelInfoSettings;
  playlistsSettings!: PlaylistsSettings;
  subscriptionsSettings!: SubscriptionsSettings;
  apiConfigSettings!: ApiConfigSettings;
  aboutSettings!: AboutSettings;

  isApiConnected = false;
  isLoading = false;
  showApiKey = false;
  showClientSecret = false;

  isCountryModalOpen = false;
  countrySelectSheetConfig: SheetConfig = {
    breakpoints: [
      { id: 'small', height: 90 },    // Show search and few countries
      { id: 'medium', height: 90 },   // Show more countries
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

  playlistState: PageState<PlaylistEntity> = {
    items: [],
    pages: [],
    pageIndex: 0,
    nextPageToken: null,
    prevPageToken: null,
    filter: '',
    pageSize: 10,
    total: 0,
  };

  subscriptionState: PageState<SubscriptionEntity> = {
    items: [],
    pages: [],
    pageIndex: 0,
    nextPageToken: null,
    prevPageToken: null,
    filter: '',
    pageSize: 10,
    total: 0,
  };

  country!: HTMLIonModalElement;
  language!: HTMLIonModalElement;

  @ViewChild(SheetDirective) sheetDirective!: SheetDirective;
  @ViewChild(GridComponent) gridComponent!: GridComponent;

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private settings: Settings,
    private helper: Helper,
    private authorization: Authorization,
    private theme: ThemeService,
    private sheetService: SheetService
  ) {}

  async ngOnInit() {
    this.subscriptions.push(
      this.settings.appearance.subscribe(value => this.appearanceSettings = value),
      this.settings.search.subscribe(value => this.searchSettings = value),
      this.settings.userInfo.subscribe(value => this.userInfoSettings = value),
      this.settings.playlists.subscribe(value => this.playlistsSettings = value),
      this.settings.subscriptions.subscribe(value => this.subscriptionsSettings = value),
      this.settings.apiConfig.subscribe(value => { this.apiConfigSettings = value; this.checkApiConnection(); }),
      this.settings.about.subscribe(value => this.aboutSettings = value),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onThemeChange() {
    this.theme.setTheme(this.appearanceSettings.theme as Theme);
    this.saveAppearanceSettings();
  }

  onFontSizeChange() {
    this.theme.setRootFontSize(this.appearanceSettings.fontSize);
    this.saveAppearanceSettings();
  }

  onThumbnailSizeChange() {
    this.saveAppearanceSettings();
  }

  onAutoCompleteChange() {
    this.saveAppearanceSettings();
  }

  onDisplayDescriptionChange() {
    this.saveAppearanceSettings();
  }

  onBackdropChange() {
    this.saveAppearanceSettings();
  }

  onDisplayResultsChange() {
    this.saveAppearanceSettings();
  }

  onMaxItemsPerRequestChange() {
    this.saveSearchSettings();
  }

  onSafeSearchChange() {
    this.saveSearchSettings();
  }

  getSectionTitle(): string {
    const sectionTitles: { [key: string]: string } = {
      'channel-info': 'Channel Info',
      appearance: 'Theme Settings',
      'search': 'Search Preferences',
      playlists: 'Playlists Management',
      subscriptions: 'Subscriptions',
      'api-key': 'API Configuration',
      about: 'About',
    };
    return sectionTitles[this.selectedMainSection] || 'YouTube Data API Settings';
  }

  async openCountryModal() {
    const modal = await this.sheetService.open(CountrySelectModalComponent, {
      breakpoints: [
        { id: 'small', height: 90 },
        { id: 'medium', height: 90 },
        { id: 'large', height: 90 },
        { id: 'close', height: 0, isClosing: true }
      ],
      initialBreakpoint: 'large',
      backdropDismiss: true,
      showBackdrop: true,
      canDismiss: true,
      width: '600px',
      height: '70vh',
      maxWidth: '90vw',
      maxHeight: '90vh',
    }, {
      selectedCountry: this.searchSettings.country,
      selectedLanguage: this.searchSettings.language
    });

    // Handle outputs
    modal.instance.close.subscribe(() => this.sheetService.close());
    modal.instance.select.subscribe((event: any) => this.handleSelection(event));
  }

  async handleSelection(event: CountryLanguageSelection) {
    this.settings.updateSearchPreferences({...this.settings.search.snappy, country: event.country, language: event.language })
    await this.sheetService.close();
  }

  get playlistCount(): number {
    return this.playlistState.items.length;
  }

  get subscriptionCount(): number {
    return this.subscriptionState.items.length;
  }

  async checkApiConnection() {
    if (!this.authorization.isSignedIn()) {
      this.isApiConnected = false;
      return;
    }
    if (!this.apiConfigSettings.apiKey) {
      this.isApiConnected = false;
      return;
    }

    this.isApiConnected = true;
  }

  async loadChannelData() {
    this.isLoading = true;
    try {
      if (this.isApiConnected) {
        const channelResponse: any = await firstValueFrom(this.helper.getMyChannel());
        const channel = channelResponse.items[0];
        this.channelInfoSettings = {
          ...this.channelInfoSettings,
          name: channel.snippet.title,
          channelId: channel.id,
          channelUrl: channel.snippet.customUrl,
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

  async loadPlaylists(pageToken?: string): Promise<{ items: PlaylistEntity[]; nextPageToken?: string }> {
    if (!this.isApiConnected) {
      return { items: this.playlistState.items, nextPageToken: '' };
    }
    this.isLoading = true;
    try {
      const response: any = await firstValueFrom(this.helper.listPlaylistsPaginated(pageToken));
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

  async loadSubscriptions(pageToken?: string): Promise<{ items: SubscriptionEntity[]; nextPageToken?: string }> {
    if (!this.isApiConnected) {
      return ({ items: this.subscriptionsSettings.items || [], nextPageToken: '' });
    }
    this.isLoading = true;
    try {
      const response: any = await firstValueFrom(this.helper.listSubscriptionsPaginated(pageToken));
      const items = response.items.map((item: any) => ({
        id: item.snippet.resourceId.channelId,
        name: item.snippet.title,
        subscriberCount: 0, // Additional API call needed for actual count
        category: '', // Not directly available
        thumbnail: item.snippet.thumbnails?.default?.url || 'assets/channel-default.jpg',
      }));
      this.subscriptionsSettings = {
        ...this.subscriptionsSettings,
        items,
        pages: pageToken ? [...(this.subscriptionsSettings.pages || []), items] : [items],
        pageIndex: pageToken ? this.subscriptionsSettings.pageIndex + 1 : 0,
        nextPageToken: response.nextPageToken || null,
        prevPageToken: pageToken || null,
      };
      this.settings.subscriptions.next(this.subscriptionsSettings);
      return { items, nextPageToken: response.nextPageToken };
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      return { items: this.subscriptionsSettings.items || [], nextPageToken: '' };
    } finally {
      this.isLoading = false;
    }
  }

  async unsubscribe(subscription: SubscriptionEntity) {
    try {
      await firstValueFrom(this.helper.unsubscribe(subscription.id));
      const filteredSubs = this.subscriptionsSettings.items.filter((s) => s.id !== subscription.id);
      this.subscriptionsSettings = {
        ...this.subscriptionsSettings,
        items: filteredSubs,
        pages: [filteredSubs],
        pageIndex: 0,
        nextPageToken: null,
        prevPageToken: null,
      };
      this.settings.subscriptions.next(this.subscriptionsSettings);
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }

  async selectMainSection(section: string) {
    this.selectedMainSection = section;

    // Scroll to top
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(300);
    }

    this.refreshData(section);
  }

  async saveAppearanceSettings() {
    this.settings.appearance.next(this.appearanceSettings);
  }

  async saveSearchSettings() {
    this.settings.search.next(this.searchSettings);
  }

  async saveApiConfig() {
    this.settings.apiConfig.next(this.apiConfigSettings);
  }

  async testApiConnection() {
    if (!this.apiConfigSettings.apiKey) {
      this.isApiConnected = false;
      return;
    }
    this.isLoading = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.isApiConnected = true;
      await this.loadChannelData();
    } catch (error) {
      console.error('API Connection Error:', error);
      this.isApiConnected = false;
    } finally {
      this.isLoading = false;
    }
  }

  async refreshData(section: string) {

    // Ensure API connection is checked
    await this.checkApiConnection();
    if (!this.isApiConnected) return;

    // Load data conditionally
    switch (section) {
      case 'channel-info': // in case string literal is used
        await this.loadChannelData();
        break;

      case 'playlists':
        await this.loadPlaylists();
        break;

      case 'subscriptions':
        await this.loadSubscriptions();
        break;
    }
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
    return num.toLocaleString(this.searchSettings.numberFormat);
  }

  getQuotaPercentage(): number {
    return Math.round((this.apiConfigSettings.quotaUsage / this.apiConfigSettings.quotaLimit) * 100);
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
