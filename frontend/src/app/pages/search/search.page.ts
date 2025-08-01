import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { createSubject, fork, of, Stream, Subscription } from '@actioncrew/streamix';
import { map, switchMap, takeUntil } from '@actioncrew/streamix';
import { YoutubeVideoComponent } from 'src/app/components/video/youtube-video.component';
import { YoutubePlaylistComponent } from 'src/app/components/playlist/youtube-playlist.component';
import { YoutubeChannelComponent } from 'src/app/components/channel/youtube-channel.component';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { SuggestionsDropdownComponent } from 'src/app/components/suggestions/suggestions.component';
import { DirectiveModule } from 'src/app/directives';
import { GoogleSuggestionsService } from 'src/app/services/suggestions.service';
import { PlaylistService } from 'src/app/services/playlist.service';
import { YoutubeDataService } from 'src/app/services/data.service';
import { Authorization } from 'src/app/services/authorization.service';
import { PlayerService } from './../../services/player.service';
import { RecorderService } from 'src/app/services/recorder.service';
import { Settings } from 'src/app/services/settings.service';
import { AppearanceSettings } from 'src/app/interfaces/settings';

@Component({
  selector: 'app-search-page',
  template: `
    <ion-header>
      <div class="scrollable">
        <div class="toolbar-inner">
          <div class="toolbar scrollable">
            <div class="toolbar-left">
              <ion-button fill="clear" size="medium" (click)="toggleMenu()">
                <ion-icon name="menu-outline"></ion-icon>
              </ion-button>
              <ion-title>YouTube Search</ion-title>
            </div>
            <div class="toolbar-right">
              <div
                class="search-container"
                #searchContainer
                [class.disabled]="filters.trending && searchType === 'videos'"
                (animationend)="onAnimationEnd()"
              >
                <ion-icon
                  name="search-outline"
                  [class.disabled]="filters.trending && searchType === 'videos'"
                ></ion-icon>
                <ion-input
                  color="primary"
                  #searchbar
                  id="search-input"
                  [(ngModel)]="searchQuery"
                  placeholder="Enter search query"
                  (ionInput)="onSearchQueryChange($event)"
                  (ionFocus)="suggestionsDropdown.handleFocus()"
                  (ionBlur)="suggestionsDropdown.handleBlur()"
                  (keydown)="suggestionsDropdown.handleKeydown($event)"
                  [class.disabled]="filters.trending && searchType === 'videos'"
                  [class.invalid]="queryInvalid"
                ></ion-input>
                <div class="icon-buttons">
                  @if (searchbar.value) {
                    <ion-button
                      fill="clear"
                      size="small"
                      (mousedown)="clearSearch($event)"
                      [class.disabled]="filters.trending && searchType === 'videos'"
                    >
                      <ion-icon name="close-circle" class="clear-icon"></ion-icon>
                    </ion-button>
                  }
                  <ion-button
                    fill="clear"
                    id="sort-button"
                    size="small"
                    [color]="sortOrder ? 'primary' : undefined"
                    [class.disabled]="filters.trending && searchType === 'videos'"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-arrow-down-az-icon lucide-arrow-down-a-z"
                    >
                      <path d="m3 16 4 4 4-4" />
                      <path d="M7 20V4" />
                      <path d="M20 8h-5" />
                      <path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10" />
                      <path d="M15 14h5l-5 6h5" />
                    </svg>
                  </ion-button>
                </div>
                @if (appearanceSettings && appearanceSettings.displayResults === 'search') {
                  <ion-button
                    size="small"
                    class="search-button"
                    (click)="performSearch()"
                  >
                    Search
                  </ion-button>
                }
              </div>
              <app-suggestions-dropdown
                #suggestionsDropdown
                [searchQuery]="searchQuery"
                [appearanceSettings]="appearanceSettings"
                [searchContainer]="searchContainer"
                (suggestionSelected)="selectSuggestion($event)"
              ></app-suggestions-dropdown>
              <ion-popover
                trigger="sort-button"
                triggerAction="click"
                [dismissOnSelect]="true"
                showBackdrop="false"
                class="scrollable"
              >
                <ng-template>
                  <ion-list>
                    <ion-item
                      button
                      (click)="setSort('')"
                      [color]="sortOrder === '' ? 'primary' : ''"
                    >
                      Relevance (default)
                    </ion-item>
                    <ion-item
                      button
                      (click)="setSort('date')"
                      [color]="sortOrder === 'date' ? 'primary' : ''"
                    >
                      Upload Date
                    </ion-item>
                    <ion-item
                      button
                      (click)="setSort('viewCount')"
                      [color]="sortOrder === 'viewCount' ? 'primary' : ''"
                    >
                      View Count
                    </ion-item>
                    <ion-item
                      button
                      (click)="setSort('rating')"
                      [color]="sortOrder === 'rating' ? 'primary' : ''"
                    >
                      Rating
                    </ion-item>
                    <ion-item
                      button
                      (click)="setSort('title')"
                      [color]="sortOrder === 'title' ? 'primary' : ''"
                    >
                      Title
                    </ion-item>
                  </ion-list>
                </ng-template>
              </ion-popover>
              <ion-button fill="clear" size="small" (click)="toggleRecorder()">
                <ion-icon name="videocam-outline"></ion-icon>
              </ion-button>
              <ion-button fill="clear" size="small" (click)="togglePlayer()">
                @if (!playerHidden$.snappy) {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-eye-off-icon lucide-eye-off"
                  >
                    <path
                      d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
                    />
                    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                    <path
                      d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
                    />
                    <path d="m2 2 20 20" />
                  </svg>
                } @if (playerHidden$.snappy) {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-eye-icon lucide-eye"
                  >
                    <path
                      d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                }
              </ion-button>
              <ion-button fill="clear" size="small" id="settings-button">
                <ion-icon name="settings-outline"></ion-icon>
              </ion-button>
              <ion-popover
                trigger="settings-button"
                triggerAction="click"
                [dismissOnSelect]="true"
                showBackdrop="false"
                class="scrollable"
              >
                <ng-template>
                  <ion-list>
                    <ion-item
                      class="popover-item"
                      button
                      (click)="goToPreferences()"
                    >Preferences</ion-item>
                    <ion-item class="popover-item" button (click)="reportBug()"
                    >Report a Bug</ion-item>
                    <ion-item
                      class="popover-item"
                      button
                      (click)="sendFeedback()"
                    >Send Feedback</ion-item>
                    <ion-item class="popover-item" button (click)="goToAbout()"
                    >About</ion-item>
                    @if (auth$ | async; as auth) {
                      <ion-item class="popover-item" button (click)="signOut()"
                      >Sign Out</ion-item>
                    } @else {
                      <ion-item class="popover-item" button (click)="signIn()">
                        <ion-label>
                          <div class="google-signin-label">
                            Sign in with Google
                          </div>
                        </ion-label>
                        <ion-button
                          #googleLogInButton
                          id="google-signin-btn"
                          fill="clear"
                          size="small"
                          class="google-signin-button"
                        >
                          <svg
                            class="google-icon"
                            viewBox="0 0 24 24"
                            width="1em"
                            height="1em"
                          >
                            <path
                              fill="#4285f4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34a853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#fbbc05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#ea4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </ion-button>
                      </ion-item>
                    }
                  </ion-list>
                </ng-template>
              </ion-popover>
            </div>
          </div>
        </div>
      </div>
    </ion-header>
    <ion-content class="main">
      <ion-item>
        <ion-segment
          [(ngModel)]="searchType"
          (ionChange)="onSearchTypeChange()"
        >
          <ion-segment-button value="videos">Videos</ion-segment-button>
          <ion-segment-button value="playlists">Playlists</ion-segment-button>
          <ion-segment-button value="channels">Channels</ion-segment-button>
        </ion-segment>
      </ion-item>
      <div class="scrollable">
        <div class="filter-inner">
          <app-filter
            [searchType]="searchType"
            (filtersChanged)="onFiltersChanged($event)"
          >
          </app-filter>
        </div>
      </div>
      @if (appearanceSettings && appearanceSettings.autoComplete === 'chips') {
        @for (suggestion of suggestions; track suggestion) {
          <ion-chip (click)="selectSuggestion(suggestion)">
            {{ suggestion }}
          </ion-chip>
        }
      }
      <div class="adaptive-grid" [style.--thumbnail-max-width.px]="gridSize">
        @if (searchType === 'videos') { @for (video of searchResults['videos'];
        track video) {
          <app-youtube-video
            [videoData]="video"
            [isCompact]="false"
            [displayDescription]="appearanceSettings.displayDescription"
            (addTrackToPlaylist)="addTrackToPlaylist($event)"
          >
          </app-youtube-video>
        } } @if (searchType === 'playlists') { @for (playlist of
        searchResults['playlists']; track playlist) {
          <app-youtube-playlist
            [playlistData]="playlist"
            [displayDescription]="appearanceSettings.displayDescription"
          >
          </app-youtube-playlist>
        } } @if (searchType === 'channels') { @for (channel of
        searchResults['channels']; track channel) {
          <app-youtube-channel
            [channelData]="channel"
            [displayDescription]="appearanceSettings.displayDescription"
          >
          </app-youtube-channel>
        } }
      </div>
      <ion-infinite-scroll (ionInfinite)="loadMore($event)">
        <ion-infinite-scroll-content
          loadingSpinner="bubbles"
          loadingText="Loading more..."
        >
        </ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `,
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DirectiveModule,
    YoutubeVideoComponent,
    YoutubePlaylistComponent,
    YoutubeChannelComponent,
    FilterComponent,
    SuggestionsDropdownComponent
  ],
})
export class SearchPage implements AfterViewInit, OnDestroy {
  public searchQuery: string = '';
  public queryInvalid: boolean = false;
  public suggestions: string[] = [];
  public searchType: 'videos' | 'playlists' | 'channels' = 'videos';
  public searchResults: {
    [key in 'videos' | 'playlists' | 'channels']: any[];
  } = {
    videos: [],
    playlists: [],
    channels: [],
  };
  public pageTokens: { [key in 'videos' | 'playlists' | 'channels']: string } = {
    videos: '',
    playlists: '',
    channels: '',
  };
  public sortOrder: string = '';
  public filters: any = {};
  public showSearchInput: boolean = false;
  public appearanceSettings!: AppearanceSettings;
  private lastSearchQuery: string = '';
  private lastSearchType: string = '';
  public readonly queryChanged$ = createSubject<string>();
  private readonly destroy$ = createSubject<void>();
  public readonly auth$ = this.authorization.authSubject;
  public readonly playbackState$ = this.playlistService.playbackState$;
  public readonly playerHidden$ = this.playerService.isHidden$;
  public readonly recorderHidden$ = this.recorderService.isHidden$;
  private subscriptions: Subscription[] = [];

  @ViewChild('googleLogInButton', { static: false }) googleLogInButton!: ElementRef<HTMLElement>;
  @ViewChild('suggestionsDropdown') private suggestionsDropdown!: SuggestionsDropdownComponent;

  constructor(
    private googleSuggestionsService: GoogleSuggestionsService,
    private dataService: YoutubeDataService,
    private playlistService: PlaylistService,
    private playerService: PlayerService,
    private recorderService: RecorderService,
    private authorization: Authorization,
    private toastCtrl: ToastController,
    private router: Router,
    private settings: Settings,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    if (this.googleLogInButton?.nativeElement) {
      this.authorization.initializeGsiButton();
    }

    this.subscriptions.push(
      this.settings.appearance
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          this.appearanceSettings = value;
        }),
      this.dataService.searchError$
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (msg) => {
          const toast = await this.toastCtrl.create({
            message: msg,
            duration: 3000,
            position: 'bottom',
            color: 'danger',
          });
          await toast.present();
        })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (!this.suggestionsDropdown.handleDocumentClick(event)) {
      return;
    }
  }

  onSearchQueryChange(event: CustomEvent): void {
    const query = (event.detail.value || '').trim();
    this.queryInvalid = false;
    this.suggestionsDropdown.updateQuery(query);
  }

  onAnimationEnd(): void {
    this.queryInvalid = false;
  }

  clearSearch(event: Event): void {
    event.preventDefault();
    this.searchQuery = '';
    this.onSearchQueryChange({ detail: { value: '' } } as CustomEvent);
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.suggestions = [];
    if (this.appearanceSettings?.displayResults === 'change') {
      this.performSearch();
    }
  }

  performSearch(): void {
    const params = this.buildSearchParams();
    this.queryInvalid = false;
    this.lastSearchQuery = this.searchQuery.trim();
    this.lastSearchType = this.searchType;

    if (!this.filters.trending && this.lastSearchQuery === '') {
      this.queryInvalid = true;
    }

    of(true)
      .pipe(
        fork([
          { on: () => this.queryInvalid, handler: () => of([]) },
          {
            on: () => this.filters.trending && this.searchType === 'videos',
            handler: () =>
              this.dataService.fetchTrendingVideos().pipe(
                map((response: any) => {
                  this.updatePageToken(response);
                  return response.items;
                })
              ),
          },
          {
            on: () => true,
            handler: () =>
              this.dataService.search('search', params).pipe(
                switchMap((response: any) => {
                  const basic = this.mapResults(response);
                  let detailed$: Stream<any>;

                  if (this.searchType === 'videos') {
                    detailed$ = this.dataService.fetchVideos(basic.map((i) => i.id));
                  } else if (this.searchType === 'playlists') {
                    detailed$ = this.dataService.fetchPlaylists(basic.map((i) => i.id));
                  } else if (this.searchType === 'channels') {
                    detailed$ = this.dataService.fetchChannels(basic.map((i) => i.id));
                  } else {
                    throw new Error('Unknown search type.');
                  }

                  return detailed$.pipe(
                    map((detailedItems: any) => {
                      this.updatePageToken(response);
                      return detailedItems.items;
                    })
                  );
                })
              ),
          },
        ]),
        map((items) => this.filterAndMerge(items)),
        takeUntil(this.destroy$)
      )
      .subscribe((finalResults: any[]) => {
        this.searchResults[this.searchType] = finalResults;
      });
  }

  loadMore(event: any): void {
    const params = this.buildSearchParams();

    of(true)
      .pipe(
        fork([
          { on: () => this.queryInvalid, handler: () => of([]) },
          {
            on: () => this.filters.trending && this.searchType === 'videos',
            handler: () =>
              this.dataService.fetchTrendingVideos(params).pipe(
                map((response: any) => {
                  this.updatePageToken(response);
                  return response.items;
                })
              ),
          },
          {
            on: () => true,
            handler: () =>
              this.dataService.search('search', params).pipe(
                switchMap((response: any) => {
                  const basic = this.mapResults(response);
                  let detailed$: Stream<any>;

                  if (this.searchType === 'videos') {
                    detailed$ = this.dataService.fetchVideos(basic.map((i) => i.id));
                  } else if (this.searchType === 'playlists') {
                    detailed$ = this.dataService.fetchPlaylists(basic.map((i) => i.id));
                  } else if (this.searchType === 'channels') {
                    detailed$ = this.dataService.fetchChannels(basic.map((i) => i.id));
                  } else {
                    throw new Error('Unknown search type.');
                  }

                  return detailed$.pipe(
                    map((detailedItems: any) => {
                      this.updatePageToken(response);
                      return this.filterAndMerge(detailedItems.items);
                    })
                  );
                })
              ),
          },
        ]),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (newItems: any[]) => {
          this.searchResults[this.searchType] = [
            ...(this.searchResults[this.searchType] || []),
            ...newItems,
          ];
          (event.target as HTMLIonInfiniteScrollElement).complete();
          if (!this.pageTokenAvailable()) {
            (event.target as HTMLIonInfiniteScrollElement).disabled = true;
          }
        },
        error: (err) => {
          console.error('Error loading more results:', err);
          (event.target as HTMLIonInfiniteScrollElement).complete();
        },
      });
  }

  private buildSearchParams(): any {
    const params: any = {
      q: this.searchQuery,
      maxResults: 10,
    };

    if (this.pageTokens[this.searchType]) {
      params.pageToken = this.pageTokens[this.searchType];
    }

    switch (this.searchType) {
      case 'videos':
        params.type = 'video';
        break;
      case 'channels':
        params.type = 'channel';
        break;
      case 'playlists':
        params.type = 'playlist';
        break;
    }

    if (this.sortOrder) {
      params.order = this.sortOrder;
    }

    return params;
  }

  private mapResults(response: any): { id: string }[] {
    return response.items.map((item: any) => ({
      id: item.id.videoId || item.id.playlistId || item.id.channelId,
    }));
  }

  private filterAndMerge(detailed: any[]): any[] {
    const requiredFields = {
      videos: ['snippet', 'contentDetails', 'statistics'],
      playlists: ['snippet', 'contentDetails'],
      channels: ['snippet', 'contentDetails', 'statistics'],
    }[this.searchType]!;

    return detailed.filter((item: any) =>
      requiredFields.every((field) => field in item)
    );
  }

  updatePageToken(response: any = null): void {
    if (this.searchType in this.pageTokens) {
      this.pageTokens[this.searchType] = response?.nextPageToken || '';
    }
  }

  pageTokenAvailable(): boolean {
    return !!this.pageTokens[this.searchType];
  }

  get gridSize(): number {
    switch (this.appearanceSettings?.thumbnailSize) {
      case 'small':
        return 270;
      case 'medium':
        return 350;
      case 'large':
        return 500;
      default:
        return 350;
    }
  }

  goToPreferences(): void {
    this.router.navigate(['/settings']);
  }

  goToAbout(): void {
    console.log('Navigate to About page');
  }

  reportBug(): void {
    console.log('Report a bug');
  }

  sendFeedback(): void {
    console.log('Send feedback');
  }

  signIn(): void {
    this.authorization.signInWithOAuth2();
  }

  signOut(): void {
    this.authorization.signOut();
  }

  setSort(value: string): void {
    this.sortOrder = value;
    if (this.appearanceSettings?.displayResults === 'change') {
      this.performSearch();
    }
  }

  getSortLabel(value: string): string {
    switch (value) {
      case 'date':
        return 'Upload Date';
      case 'viewCount':
        return 'View Count';
      case 'rating':
        return 'Rating';
      case 'title':
        return 'Title';
      default:
        return 'Relevance (default)';
    }
  }

  toggleMenu(): void {
    this.playlistService.toggleMenu();
  }

  toggleSearchInput(show: boolean): void {
    this.showSearchInput = show;
    if (!show) {
      this.suggestions = [];
    }
  }

  onSearchTypeChange(): void {
    if (
      this.searchQuery.trim() === this.lastSearchQuery &&
      this.searchResults[this.searchType as keyof typeof this.searchResults].length > 0
    ) {
      return;
    }

    if (this.appearanceSettings?.displayResults === 'change') {
      this.performSearch();
    }
  }

  onFiltersChanged(filters: any): void {
    this.filters = filters;
    if (this.appearanceSettings?.displayResults === 'change') {
      this.performSearch();
    }
  }

  addTrackToPlaylist(video: any): void {
    this.playlistService.addToPlaylist(video);
  }

  togglePlayer(): void {
    this.playerHidden$.snappy
      ? this.playerService.show()
      : this.playerService.hide();
  }

  toggleRecorder(): void {
    this.recorderHidden$.snappy
      ? this.recorderService.show()
      : this.recorderService.hide();
  }
}
