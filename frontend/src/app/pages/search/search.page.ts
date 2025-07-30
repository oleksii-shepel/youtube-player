import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonInput, ToastController } from '@ionic/angular'; // Group Ionic imports

// RxJS and custom streamix imports
import { createBehaviorSubject, createSubject, filter, fork, merge, of, onResize, sample, Stream, Subscription } from '@actioncrew/streamix'; // Assuming Subscription is also from streamix
import { debounce, distinctUntilChanged, map, switchMap, takeUntil } from '@actioncrew/streamix'; // Added takeUntil

// Component and Directive imports
import { YoutubeVideoComponent } from 'src/app/components/youtube-video/youtube-video.component';
import { YoutubePlaylistComponent } from 'src/app/components/youtube-playlist/youtube-playlist.component';
import { YoutubeChannelComponent } from 'src/app/components/youtube-channel/youtube-channel.component';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { DirectiveModule } from 'src/app/directives';

// Service imports
import { GoogleSuggestionsService } from 'src/app/services/suggestions.service';
import { PlaylistService } from 'src/app/services/playlist.service';
import { YoutubeDataService } from 'src/app/services/data.service';
import { Authorization } from 'src/app/services/authorization.service';
import { PlayerService } from './../../services/player.service'; // Relative path
import { RecorderService } from 'src/app/services/recorder.service';
import { Settings } from 'src/app/services/settings.service';

// Interface imports
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
                  (ionFocus)="onSearchInputFocus($event)"
                  (ionBlur)="onSearchInputBlur($event)"
                  (keydown)="onKeydown($event)"
                  [class.disabled]="filters.trending && searchType === 'videos'"
                  [class.invalid]="queryInvalid"
                ></ion-input>

                <div class="icon-buttons">
                  @if (searchbar.value) {
                  <ion-button
                    fill="clear"
                    size="small"
                    (mousedown)="clearSearch($event)"
                    [class.disabled]="
                      filters.trending && searchType === 'videos'
                    "
                  >
                    <ion-icon name="close-circle" class="clear-icon"></ion-icon>
                  </ion-button>
                  }
                  <ion-button
                    fill="clear"
                    id="sort-button"
                    size="small"
                    [color]="sortOrder ? 'primary' : undefined"
                    [class.disabled]="
                      filters.trending && searchType === 'videos'
                    "
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
                <!-- Search button remains active - no disabled class -->
                @if (appearanceSettings && appearanceSettings.displayResults ===
                'search') {
                <ion-button
                  size="small"
                  class="search-button"
                  (click)="performSearch()"
                >
                  Search
                </ion-button>
                }
              </div>

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
                      >Preferences</ion-item
                    >
                    <ion-item class="popover-item" button (click)="reportBug()"
                      >Report a Bug</ion-item
                    >
                    <ion-item
                      class="popover-item"
                      button
                      (click)="sendFeedback()"
                      >Send Feedback</ion-item
                    >
                    <ion-item class="popover-item" button (click)="goToAbout()"
                      >About</ion-item
                    >
                    @if (auth$ | async; as auth) {
                    <ion-item class="popover-item" button (click)="signOut()"
                      >Sign Out</ion-item
                    >
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

      @if ( appearanceSettings && appearanceSettings.autoComplete === 'dropdown'
      && dropdownOpen$.snappy && suggestions.length > 0 ) {
      <div
        class="suggestions-dropdown scrollable"
        #suggestionsDropdown
        [ngStyle]="dropdownStyle"
      >
        <div class="suggestions-list">
          @for (suggestion of suggestions; track suggestion; let i = $index) {
          <div
            class="suggestion-item"
            [class.selected]="i === selectedSuggestionIndex"
            (mousedown)="$event.preventDefault(); selectSuggestion(suggestion)"
            (click)="selectSuggestion(suggestion)"
          >
            <ion-icon name="search-outline" size="small"></ion-icon>
            <span>{{ suggestion }}</span>
          </div>
          }
        </div>
      </div>
      }
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

      <!-- Filters Section -->
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
      } }

      <!-- Adaptive Grid -->
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
  ],
})
export class SearchPage implements AfterViewInit, OnDestroy {
  // --- Component State ---
  // Search Input & Suggestions
  public searchQuery: string = '';
  public queryInvalid: boolean = false;
  public suggestions: string[] = [];
  public selectedSuggestionIndex: number = -1;
  public dropdownStyle: any = {};

  // Search Results & Type
  public searchType: 'videos' | 'playlists' | 'channels' = 'videos'; // Stronger typing
  public searchResults: {
    [key in 'videos' | 'playlists' | 'channels']: any[];
  } = {
    videos: [],
    playlists: [],
    channels: [],
  };
  public pageTokens: { [key in 'videos' | 'playlists' | 'channels']: string } =
    {
      videos: '',
      playlists: '',
      channels: '',
    };
  public sortOrder: string = '';
  public filters: any = {}; // Consider defining a more specific interface for filters

  // UI State
  public showSearchInput: boolean = false; // Controls visibility of the search input container
  public appearanceSettings!: AppearanceSettings; // Settins from settings service

  // Private internal state for search tracking
  private lastSearchQuery: string = '';
  private lastSearchType: string = '';

  // RxJS Subjects for reactive logic
  public readonly queryChanged$ = createSubject<string>();
  private readonly destroy$ = createSubject<void>(); // For RxJS cleanup

  // Observables from services (exposed for async pipe in template)
  public readonly auth$ = this.authorization.authSubject;
  public readonly playbackState$ = this.playlistService.playbackState$;
  public readonly playerHidden$ = this.playerService.isHidden$;
  public readonly recorderHidden$ = this.recorderService.isHidden$;
  public readonly dropdownOpen$ = createBehaviorSubject<boolean>(false);

  private subscriptions: Subscription[] = [];

  @ViewChild('searchbar') private searchbar!: IonInput;
  @ViewChild('searchContainer')
  private searchContainer!: ElementRef<HTMLElement>;
  @ViewChild('suggestionsDropdown')
  private suggestionsDropdown!: ElementRef<HTMLElement>;
  @ViewChild('googleLogInButton', { static: false })
  googleLogInButton!: ElementRef<HTMLElement>;

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

  // --- Lifecycle Hooks ---
  ngAfterViewInit(): void {
    // Initialize Google Sign-In button if available in the DOM
    if (this.googleLogInButton?.nativeElement) {
      this.authorization.initializeGsiButton();
    }

    this.subscriptions.push(
      // Subscribe to settings changes for appearance
      this.settings.appearance
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          this.appearanceSettings = value;
        }),

      // Handle search query changes for suggestions (debounced and distinct)
      this.queryChanged$
        .pipe(
          sample(1000),
          distinctUntilChanged(),
          switchMap((query: string) => {
            // Only fetch suggestions if query has 2 or more characters
            if (!query || query.length < 2) {
              return of([]); // Return empty array to stop further processing
            }
            return this.fetchSuggestions(query);
          }),
          takeUntil(this.destroy$) // Unsubscribe when component is destroyed
        )
        .subscribe((suggestions: string[]) => {
          this.suggestions = suggestions;
          // Open dropdown only if there are suggestions
          this.dropdownOpen$.next(suggestions.length > 0);
          this.selectedSuggestionIndex = -1; // Reset selection
        }),

      // Subscribe to search errors from data service and display a toast
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
        }),

      this.settings.appearance.pipe(
        map((appearanceSettings: AppearanceSettings) => appearanceSettings.autoComplete === 'dropdown'),
        filter((value: boolean) => value),
        switchMap(() =>
          merge(
            onResize(this.searchContainer.nativeElement).pipe(map(() => true)),
            this.dropdownOpen$
          ).pipe(
              filter((value: boolean) => value),
              takeUntil(this.destroy$)
          )
        )).subscribe(() => {
          this.positionDropdown();
        })
      );
  }

  ngOnDestroy(): void {
    // Signal completion to destroy$ to unsubscribe all active RxJS subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Method to calculate and set dropdown position
  private positionDropdown(): void {
    if (this.searchContainer?.nativeElement && this.dropdownOpen$.snappy) {
      requestAnimationFrame(() => {
        const searchInputEl = this.searchContainer.nativeElement;
        const rect = searchInputEl.getBoundingClientRect();

        const contentEl = document.querySelector(
          'ion-split-pane > .split-pane-main'
        );
        const contentRect = contentEl?.getBoundingClientRect();
        const contentLeft = contentRect?.left || 0;

        this.dropdownStyle = {
          position: 'fixed',
          top: `${rect.bottom + 8}px`,
          left: `${rect.left - contentLeft}px`,
          width: `${rect.width}px`,
          zIndex: '1000',
        };
      });
    } else {
      this.dropdownStyle = {};
    }
  }

  onSearchInputFocus(event: CustomEvent): void {
    // Show dropdown if we have suggestions and query length > 2
    if (this.suggestions.length > 0 && this.searchQuery.trim().length > 2) {
      this.dropdownOpen$.next(true);
    }
  }

  onSearchInputBlur(event: CustomEvent): void {
    // Small delay to allow suggestion clicks to register before closing
    setTimeout(() => {
      this.dropdownOpen$.next(false);
      this.selectedSuggestionIndex = -1;
    }, 150);
  }

  // --- Event Handlers ---
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    // Close dropdown if click is outside the search container
    const searchContainer = (this.searchbar as any)?.el?.closest(
      '.search-container'
    );
    if (
      searchContainer &&
      !searchContainer.contains(event.target as Node) &&
      this.dropdownOpen$.snappy
    ) {
      this.dropdownOpen$.next(false);
    }
  }

  onSearchQueryChange(event: CustomEvent): void {
    // Use CustomEvent for Ionic input events
    const query = (event.detail.value || '').trim(); // Get value from event.detail.value and trim
    this.queryInvalid = false;

    // Trigger suggestion fetching if query has 2 or more characters
    if (query.length >= 2) {
      this.queryChanged$.next(query);
    } else {
      // Hide dropdown and clear suggestions if query is too short
      this.dropdownOpen$.next(false);
      this.suggestions = [];
    }
  }

  onKeydown(event: KeyboardEvent): void {
    // Handle keyboard navigation for suggestions
    if (this.dropdownOpen$.snappy) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.selectedSuggestionIndex = Math.min(
            this.selectedSuggestionIndex + 1,
            this.suggestions.length - 1
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.selectedSuggestionIndex = Math.max(
            this.selectedSuggestionIndex - 1,
            -1
          );
          break;
        case 'Enter':
          event.preventDefault(); // Prevent form submission
          this.dropdownOpen$.next(false);
          if (this.selectedSuggestionIndex >= 0) {
            this.selectSuggestion(
              this.suggestions[this.selectedSuggestionIndex]
            );
          } else if (this.appearanceSettings?.displayResults === 'change') {
            this.performSearch();
          }
          break;
        case 'Escape':
          this.dropdownOpen$.next(false);
          this.selectedSuggestionIndex = -1;
          break;
      }
    } else if (event.key === 'Enter') {
      this.dropdownOpen$.next(true);
      // If dropdown is not open, trigger search on Enter
      if (this.appearanceSettings?.displayResults === 'change') {
        this.performSearch();
      }
    }
  }

  onAnimationEnd(): void {
    this.queryInvalid = false;
  }

  clearSearch(event: Event): void {
    event.preventDefault(); // Prevent default button behavior
    this.searchQuery = '';
    // Manually trigger change to update dropdown visibility and suggestions
    this.onSearchQueryChange({ detail: { value: '' } } as CustomEvent); // Simulate ionInput event
  }

  // --- Search & Data Fetching Logic ---
  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.suggestions = []; // Clear suggestions after selection
    this.dropdownOpen$.next(false); // Close dropdown
    this.selectedSuggestionIndex = -1; // Reset selection
    if (this.appearanceSettings?.displayResults === 'change') {
      this.performSearch();
    }
  }

  performSearch(): void {
    const params = this.buildSearchParams();

    // Reset previous error state
    this.queryInvalid = false;

    // Store new search state for comparison
    this.lastSearchQuery = this.searchQuery.trim();
    this.lastSearchType = this.searchType;

    // Validate query if not trending
    if (!this.filters.trending && this.lastSearchQuery === '') {
      this.queryInvalid = true;
    }

    // Execute search based on conditions using `fork` (assuming custom fork for conditional streams)
    of(true)
      .pipe(
        // Start with a dummy observable to trigger the fork
        fork([
          // Condition 1: Invalid query
          { on: () => this.queryInvalid, handler: () => of([]) },
          // Condition 2: Trending videos search
          {
            on: () => this.filters.trending && this.searchType === 'videos',
            handler: () =>
              this.dataService.fetchTrendingVideos().pipe(
                map((response: any) => {
                  this.updatePageToken(response);
                  return response.items; // Trending videos are already detailed
                })
              ),
          },
          // Condition 3: General search (videos, playlists, channels)
          {
            on: () => true, // Default case if previous conditions are false
            handler: () =>
              this.dataService.search('search', params).pipe(
                switchMap((response: any) => {
                  const basic = this.mapResults(response); // Extract basic IDs
                  let detailed$: Stream<any>;

                  // Fetch detailed information based on search type
                  if (this.searchType === 'videos') {
                    detailed$ = this.dataService.fetchVideos(
                      basic.map((i) => i.id)
                    );
                  } else if (this.searchType === 'playlists') {
                    detailed$ = this.dataService.fetchPlaylists(
                      basic.map((i) => i.id)
                    );
                  } else if (this.searchType === 'channels') {
                    detailed$ = this.dataService.fetchChannels(
                      basic.map((i) => i.id)
                    );
                  } else {
                    // This case should ideally not be reached with strong typing
                    throw new Error('Unknown search type.');
                  }

                  return detailed$.pipe(
                    map((detailedItems: any) => {
                      this.updatePageToken(response); // Update page token from initial search response
                      return detailedItems.items; // Return detailed items
                    })
                  );
                })
              ),
          },
        ]),
        map((items) => this.filterAndMerge(items)), // Apply final filtering and merging
        takeUntil(this.destroy$) // Unsubscribe when component is destroyed
      )
      .subscribe((finalResults: any[]) => {
        this.searchResults[this.searchType] = finalResults; // Update results for current type
      });
  }

  loadMore(event: any): void {
    // `event` is typically an InfiniteScrollCustomEvent
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
                    detailed$ = this.dataService.fetchVideos(
                      basic.map((i) => i.id)
                    );
                  } else if (this.searchType === 'playlists') {
                    detailed$ = this.dataService.fetchPlaylists(
                      basic.map((i) => i.id)
                    );
                  } else if (this.searchType === 'channels') {
                    detailed$ = this.dataService.fetchChannels(
                      basic.map((i) => i.id)
                    );
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
        takeUntil(this.destroy$) // Unsubscribe when component is destroyed
      )
      .subscribe({
        next: (newItems: any[]) => {
          this.searchResults[this.searchType] = [
            ...(this.searchResults[this.searchType] || []),
            ...newItems,
          ];
          (event.target as HTMLIonInfiniteScrollElement).complete(); // Cast event.target
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

  // --- Helper Methods ---
  private buildSearchParams(): any {
    // Return type could be more specific if you have a SearchParams interface
    const params: any = {
      q: this.searchQuery,
      maxResults: 10, // Default max results
    };

    if (this.pageTokens[this.searchType]) {
      params.pageToken = this.pageTokens[this.searchType];
    }

    // Set search type parameter
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
    // Stronger return type
    return response.items.map((item: any) => ({
      id: item.id.videoId || item.id.playlistId || item.id.channelId,
    }));
  }

  private filterAndMerge(detailed: any[]): any[] {
    const requiredFields = {
      videos: ['snippet', 'contentDetails', 'statistics'],
      playlists: ['snippet', 'contentDetails'],
      channels: ['snippet', 'contentDetails', 'statistics'],
    }[this.searchType]!; // Use non-null assertion as searchType is strictly typed

    return detailed.filter((item: any) =>
      requiredFields.every((field) => field in item)
    );
  }

  updatePageToken(response: any = null): void {
    if (this.searchType in this.pageTokens) {
      // More robust check
      this.pageTokens[this.searchType] = response?.nextPageToken || '';
    }
  }

  pageTokenAvailable(): boolean {
    return !!this.pageTokens[this.searchType]; // Check for truthiness
  }

  fetchSuggestions(query: string): Stream<string[]> {
    return this.googleSuggestionsService
      .getSuggestions(query)
      .pipe(debounce(300), distinctUntilChanged());
  }

  get gridSize(): number {
    // Provide a default return value outside the switch
    switch (this.appearanceSettings?.thumbnailSize) {
      case 'small':
        return 270;
      case 'medium':
        return 350;
      case 'large':
        return 500;
      default:
        return 350; // Default size if appearanceSettings or thumbnailSize is undefined
    }
  }

  // --- UI Interaction Methods ---
  addActivated(event: Event): void {
    (event.currentTarget as HTMLElement).classList.add('ion-activated');
  }

  removeActivated(event: Event): void {
    (event.currentTarget as HTMLElement).classList.remove('ion-activated');
  }

  goToPreferences(): void {
    this.router.navigate(['/settings']);
  }

  goToAbout(): void {
    // Implement navigation or modal for About page
    console.log('Navigate to About page');
  }

  reportBug(): void {
    // Implement bug reporting logic
    console.log('Report a bug');
  }

  sendFeedback(): void {
    // Implement feedback sending logic
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
      this.dropdownOpen$.next(false); // Ensure dropdown hides when search input is toggled off
    }
  }

  onSearchTypeChange(): void {
    // If the search type changed AND the query is the same AND we have results for the new type, skip search.
    // This optimization prevents redundant API calls if switching between types with same query and existing results.
    if (
      this.searchQuery.trim() === this.lastSearchQuery &&
      this.searchResults[this.searchType as keyof typeof this.searchResults]
        .length > 0 // Cast for type safety
    ) {
      return;
    }

    // Only perform search if a search was previously requested and query is not empty
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
