import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { Stream, switchMap } from '@actioncrew/streamix';
import { debounce, distinctUntilChanged, map } from '@actioncrew/streamix';
import { GoogleSuggestionsService } from 'src/app/services/google-suggestions.service';
import { PlaylistService } from 'src/app/services/playlist.service';
import { YoutubeDataService } from 'src/app/services/youtube-data.service';  // Import YoutubeDataService
import { Authorization } from 'src/app/services/authorization.service';

@Component({
  selector: 'app-search',
  template: `
    <ion-header>
      <div class="scrollable">
        <div class="toolbar-inner">
          <div class="toolbar">
            <div class="toolbar-left">
              <ion-title>YouTube Search</ion-title>
            </div>

            <div class="toolbar-right">
              <div class="search-container">
                <ion-icon name="search-outline"></ion-icon>
                <ion-input
                  color="primary"
                  #searchbar
                  [(ngModel)]="searchQuery"
                  placeholder="Enter search query"
                  (ionInput)="onSearchQueryChange($event)"
                  (keydown)="onKeydown($event)"
                ></ion-input>
                <div class="icon-buttons">
                  <ion-button
                    fill="clear"
                    size="small"
                    (mousedown)="clearSearch($event)"
                    *ngIf="searchbar.value"
                  >
                    <ion-icon name="close-circle" class="clear-icon"></ion-icon>
                  </ion-button>
                  <ion-button
                    fill="clear"
                    id="sort-button"
                    size="small"
                    [color]="sortOrder ? 'primary' : undefined"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
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
                <ion-button (click)="searchRequested = true; performSearch()"
                  >Search</ion-button
                >
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

              <ion-button fill="clear">
                <ion-icon name="videocam-outline"></ion-icon>
              </ion-button>

              <ng-container *ngIf="auth$ | async as auth; else loginButton">
                <ion-avatar *ngIf="auth" (click)="openPopover($event)">
                  <img [src]="auth.profile.picture" />
                </ion-avatar>
              </ng-container>

              <ng-template #loginButton>
                <ion-button
                  id="google-signin-btn"
                  fill="clear"
                  class="google-signin-custom"
                >
                  <svg class="google-icon" viewBox="0 0 24 24">
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
              </ng-template>

              <ion-popover
                [isOpen]="showPopover"
                [event]="popoverEvent"
                (didDismiss)="showPopover = false"
                class="scrollable"
              >
                <ng-template>
                  <ion-list>
                    <ion-item (click)="goToProfile()">View Profile</ion-item>
                    <ion-item (click)="logout()">Logout</ion-item>
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

      <ion-chip
        *ngFor="let suggestion of suggestions"
        (click)="selectSuggestion(suggestion)"
      >
        {{ suggestion }}
      </ion-chip>

      <!-- Adaptive Grid -->
      <div class="adaptive-grid">
        <ng-container *ngIf="searchType === 'videos'">
          <app-youtube-video
            *ngFor="let video of searchResults['videos']"
            [videoData]="video"
            [isCompact]="false"
            (addTrackToPlaylist)="addTrackToPlaylist($event)"
          >
          </app-youtube-video>
        </ng-container>
        <ng-container *ngIf="searchType === 'playlists'">
          <app-youtube-playlist
            *ngFor="let playlist of searchResults['playlists']"
            [playlistData]="playlist"
          >
          </app-youtube-playlist>
        </ng-container>
        <ng-container *ngIf="searchType === 'channels'">
          <app-youtube-channel
            *ngFor="let channel of searchResults['channels']"
            [channelData]="channel"
          >
          </app-youtube-channel>
        </ng-container>
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
  standalone: false,
})
export class SearchPage {
  searchQuery: string = '';
  searchType: string = 'videos'; // Default to video
  suggestions: string[] = [];
  pageTokens: { [key: string]: string } = {
    // Using an object for pageTokens
    videos: '',
    playlists: '',
    channels: '',
  };
  searchResults: { [key: string]: any[] } = {
    // Separate results for each search type
    videos: [],
    playlists: [],
    channels: [],
  };
  filters: any = {}; // New filter object to hold the filter criteria

  showSearchInput = false;
  searchRequested = false;
  lastSearchQuery = '';
  lastSearchType = '';
  sortOrder: string = '';

  showPopover = false;
  popoverEvent: any;

  @Output() addToPlaylist = new EventEmitter<any>();

  @ViewChild('googleButtonContainer', { static: false })
  googleButtonContainer!: ElementRef;

  auth$ = this.authorization.authSubject;
  playbackState$ = this.playlistService.playbackState;

  constructor(
    private googleSuggestionsService: GoogleSuggestionsService,
    private youtubeDataService: YoutubeDataService,
    private playlistService: PlaylistService,
    private authorization: Authorization
  ) {}

  ngAfterViewInit() {
    const container = document.getElementById('google-signin-btn');
    if (!container) {
      console.warn('Google Sign-In button container not found');
    } else {
      this.authorization.initializeGsiButton();
    }
  }

  addActivated(event: Event) {
    (event.currentTarget as HTMLElement).classList.add('ion-activated');
  }

  removeActivated(event: Event) {
    (event.currentTarget as HTMLElement).classList.remove('ion-activated');
  }

  clearSearch(event: Event) {
    event.preventDefault();
    this.searchQuery = '';
    this.onSearchQueryChange(event);
  }

  openPopover(event: Event) {
    this.showPopover = true;
    this.popoverEvent = event;
  }

  goToProfile() {}

  setSort(value: string) {
    this.sortOrder = value;
    this.onSortOrderChanged();
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

  onSortOrderChanged() {}

  logout() {
    this.showPopover = false;
    this.authorization.signOut();
  }

  toggleSearchInput(show: boolean) {
    this.showSearchInput = show;
    if (!show) {
      this.suggestions = [];
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.searchRequested = true;
      this.performSearch();
    } else {
      this.searchRequested = false; // Reset flag on other key presses
    }
  }

  onSearchTypeChange() {
    // Check if the search type has changed but the query remains the same
    if (
      this.searchQuery.trim() === this.lastSearchQuery &&
      this.searchResults[this.searchType].length > 0
    ) {
      return; // Skip the search
    }

    if (this.searchRequested && this.searchQuery.trim()) {
      this.performSearch();
    }
  }

  onSearchQueryChange(event: any) {
    const query = event.target.value;
    if (query && query.length > 2) {
      this.fetchSuggestions(query).subscribe((suggestions: string[]) => {
        this.suggestions = suggestions;
      });
    } else {
      this.suggestions = [];
    }
  }

  onFiltersChanged(filters: any) {
    console.log('Filters changed:', filters);
    this.filters = filters; // Update filters when the filter component emits changes
    this.performSearch(); // Re-run the search when filters are updated
  }

  fetchSuggestions(query: string): Stream<string[]> {
    return this.googleSuggestionsService
      .getSuggestions(query)
      .pipe(debounce(300), distinctUntilChanged());
  }

  selectSuggestion(suggestion: string) {
    this.searchQuery = suggestion;
    this.suggestions = [];
    this.performSearch();
  }

  performSearch() {
    const params = this.buildSearchParams();

    // Store new search state
    this.lastSearchQuery = this.searchQuery.trim();
    this.lastSearchType = this.searchType;

    this.youtubeDataService
      .search('search', params)
      .pipe(
        switchMap((response: any) => {
          const results = this.mapResults(response);

          let detailedResults$: Stream<any>;

          // Fetch detailed data based on the search type
          if (this.searchType === 'videos') {
            const videoIds = results.map((item) => item.id);
            detailedResults$ = this.youtubeDataService.fetchVideos(videoIds);
          } else if (this.searchType === 'playlists') {
            const playlistIds = results.map((item) => item.id);
            detailedResults$ =
              this.youtubeDataService.fetchPlaylists(playlistIds);
          } else if (this.searchType === 'channels') {
            const channelIds = results.map((item) => item.id);
            detailedResults$ =
              this.youtubeDataService.fetchChannels(channelIds);
          } else {
            throw new Error('Unknown search type.');
          }

          // Combine basic and detailed results
          return detailedResults$.pipe(
            map((detailedItems: any) => {
              this.updatePageToken(response); // Update the correct page token

              const mergedResults = results.map((result) => {
                const detailedItem = detailedItems.items.find(
                  (item: any) => item.id === result.id
                );
                return { ...result, ...detailedItem };
              });
              return mergedResults;
            })
          );
        })
      )
      .subscribe((finalResults: any[]) => {
        this.searchResults[this.searchType] = finalResults; // Update specific search type results
      });
  }

  loadMore(event: any) {
    const params = this.buildSearchParams();

    this.youtubeDataService
      .search('search', params)
      .pipe(
        switchMap((response: any) => {
          const results = this.mapResults(response);
          let detailedResults$: Stream<any>;

          if (this.searchType === 'videos') {
            const videoIds = results.map((item) => item.id);
            detailedResults$ = this.youtubeDataService.fetchVideos(videoIds);
          } else if (this.searchType === 'playlists') {
            const playlistIds = results.map((item) => item.id);
            detailedResults$ =
              this.youtubeDataService.fetchPlaylists(playlistIds);
          } else if (this.searchType === 'channels') {
            const channelIds = results.map((item) => item.id);
            detailedResults$ =
              this.youtubeDataService.fetchChannels(channelIds);
          } else {
            throw new Error('Unknown search type.');
          }

          return detailedResults$.pipe(
            map((detailedItems: any) => {
              this.updatePageToken(response); // Update the correct page token
              const mergedResults = results.map((result) => {
                const detailedItem = detailedItems.items.find(
                  (item: any) => item.id === result.id
                );
                return { ...result, ...detailedItem };
              });
              return mergedResults;
            }),
            // Handle the correct page token for pagination
            map((finalResults: any[]) => {
              this.searchResults[this.searchType] = [
                ...this.searchResults[this.searchType],
                ...finalResults,
              ];
              return this.searchResults[this.searchType];
            })
          );
        })
      )
      .subscribe({
        next: () => {
          event.target.complete();
          // Disable infinite scroll if no more results
          if (!this.pageTokenAvailable()) {
            event.target.disabled = true;
          }
        },
        error: (err) => {
          console.error('Error loading more results:', err);
          event.target.complete();
        },
      });
  }

  updatePageToken(response: any = null) {
    if (this.searchType === 'videos') {
      this.pageTokens['videos'] = response?.nextPageToken || '';
    } else if (this.searchType === 'playlists') {
      this.pageTokens['playlists'] = response?.nextPageToken || '';
    } else if (this.searchType === 'channels') {
      this.pageTokens['channels'] = response?.nextPageToken || '';
    }
  }

  pageTokenAvailable(): boolean {
    return !!this.pageTokens[this.searchType];
  }

  buildSearchParams() {
    const params: any = {
      q: this.searchQuery,
      maxResults: 10,
    };

    if (this.pageTokens[this.searchType]) {
      params.pageToken = this.pageTokens[this.searchType];
    }

    if (this.searchType === 'videos') {
      params.type = 'video';
    } else if (this.searchType === 'channels') {
      params.type = 'channel';
    } else {
      params.type = 'playlist';
    }

    if (this.sortOrder) {
      params.order = this.sortOrder;
    }

    return params;
  }

  mapResults(response: any): any[] {
    return response.items.map((item: any) => ({
      id: item.id.videoId || item.id.playlistId || item.id.channelId,
    }));
  }

  addTrackToPlaylist(video: any) {
    this.playlistService.addToPlaylist(video);
  }
}
