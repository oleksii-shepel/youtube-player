import { Component, EventEmitter, Output } from '@angular/core';
import { Stream, switchMap } from '@actioncrew/streamix';
import { debounce, distinctUntilChanged, map } from '@actioncrew/streamix';
import { GoogleSuggestionsService } from 'src/app/services/google-suggestions.service';
import { PlaylistService } from 'src/app/services/playlist.service';
import { YoutubeDataService } from 'src/app/services/youtube-data.service';  // Import YoutubeDataService

@Component({
  selector: 'app-search',
  template: `
    <ion-header>
      <div class="toolbar">
        <div class="toolbar-left">
          <ion-title>YouTube Search</ion-title>
        </div>

        <div class="toolbar-right">
          <div class="search-container">
            <ion-icon name="search-outline"></ion-icon>
            <ion-input color="primary"
              id="searchbar"
              [(ngModel)]="searchQuery"
              placeholder="Enter search query"
              (ionInput)="onSearchQueryChange($event)"
              (keydown)="onKeydown($event)"
            ></ion-input>
             <ion-icon name="close-circle" class="clear-icon" onclick="document.getElementById('searchbar').value = ''"></ion-icon>
            <ion-button (click)="searchRequested = true; performSearch();">Search</ion-button>
          </div>

          <ion-button fill="clear">
            <ion-icon name="videocam-outline"></ion-icon>
          </ion-button>

          <ion-avatar>
            <img src="https://i.pravatar.cc/300?img=5" />
          </ion-avatar>
        </div>
      </div>
    </ion-header>

    <ion-content>
      <ion-item>
        <ion-segment [(ngModel)]="searchType" (ionChange)="onSearchTypeChange()">
          <ion-segment-button value="videos">Videos</ion-segment-button>
          <ion-segment-button value="playlists">Playlists</ion-segment-button>
          <ion-segment-button value="channels">Channels</ion-segment-button>
        </ion-segment>
      </ion-item>

      <!-- Filters Section -->
      <app-filter
        [searchType]="searchType"
        (filtersChanged)="onFiltersChanged($event)">
      </app-filter>

      <ion-chip *ngFor="let suggestion of suggestions" (click)="selectSuggestion(suggestion)">
        {{ suggestion }}
      </ion-chip>

      <!-- Adaptive Grid -->
      <div class="adaptive-grid">
        <ng-container *ngIf="searchType === 'videos'">
          <app-youtube-video
            *ngFor="let video of searchResults['videos']"
            [videoData]="video"
            [isCompact]="false"
            (addTrackToPlaylist)="addTrackToPlaylist($event)">
          </app-youtube-video>
        </ng-container>
        <ng-container *ngIf="searchType === 'playlists'">
          <app-youtube-playlist
            *ngFor="let playlist of searchResults['playlists']"
            [playlistData]="playlist">
          </app-youtube-playlist>
        </ng-container>
        <ng-container *ngIf="searchType === 'channels'">
          <app-youtube-channel
            *ngFor="let channel of searchResults['channels']"
            [channelData]="channel">
          </app-youtube-channel>
        </ng-container>
      </div>

      <ion-infinite-scroll (ionInfinite)="loadMore($event)">
        <ion-infinite-scroll-content
          loadingSpinner="bubbles"
          loadingText="Loading more...">
        </ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `,
  styleUrls: ['./search.page.scss'],
  standalone: false
})
export class SearchPage {
  searchQuery: string = '';
  searchType: string = 'videos'; // Default to video
  suggestions: string[] = [];
  pageTokens: { [key: string]: string } = {  // Using an object for pageTokens
    videos: '',
    playlists: '',
    channels: ''
  };
  searchResults: { [key: string]: any[] } = {  // Separate results for each search type
    videos: [],
    playlists: [],
    channels: []
  };
  filters: any = {}; // New filter object to hold the filter criteria

  searchRequested = false;
  lastSearchQuery = '';
  lastSearchType = '';

  @Output() addToPlaylist = new EventEmitter<any>();

  constructor(
    private googleSuggestionsService: GoogleSuggestionsService,
    private youtubeDataService: YoutubeDataService,
    private playlistService: PlaylistService
  ) {}

  showSearchInput = false;

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
    if (this.searchQuery.trim() === this.lastSearchQuery && this.searchResults[this.searchType].length > 0) {
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
    this.filters = filters;  // Update filters when the filter component emits changes
    this.performSearch();  // Re-run the search when filters are updated
  }

  fetchSuggestions(query: string): Stream<string[]> {
    return this.googleSuggestionsService.getSuggestions(query).pipe(
      debounce(300),
      distinctUntilChanged()
    );
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

    this.youtubeDataService.search('search', params).pipe(
      switchMap((response: any) => {
        const results = this.mapResults(response);

        let detailedResults$: Stream<any>;

        // Fetch detailed data based on the search type
        if (this.searchType === 'videos') {
          const videoIds = results.map(item => item.id);
          detailedResults$ = this.youtubeDataService.fetchVideos(videoIds);
        } else if (this.searchType === 'playlists') {
          const playlistIds = results.map(item => item.id);
          detailedResults$ = this.youtubeDataService.fetchPlaylists(playlistIds);
        } else if (this.searchType === 'channels') {
          const channelIds = results.map(item => item.id);
          detailedResults$ = this.youtubeDataService.fetchChannels(channelIds);
        } else {
          throw new Error('Unknown search type.');
        }


        // Combine basic and detailed results
        return detailedResults$.pipe(
          map((detailedItems: any) => {
            this.updatePageToken(response);  // Update the correct page token

            const mergedResults = results.map(result => {
              const detailedItem = detailedItems.items.find((item: any) => item.id === result.id);
              return { ...result, ...detailedItem };
            });
            return mergedResults;
          })
        );
      })
    ).subscribe((finalResults: any[]) => {
      this.searchResults[this.searchType] = finalResults; // Update specific search type results
    });
  }

  loadMore(event: any) {
    const params = this.buildSearchParams();

    this.youtubeDataService.search('search', params).pipe(
      switchMap((response: any) => {
        const results = this.mapResults(response);
        let detailedResults$: Stream<any>;

        if (this.searchType === 'videos') {
          const videoIds = results.map(item => item.id);
          detailedResults$ = this.youtubeDataService.fetchVideos(videoIds);
        } else if (this.searchType === 'playlists') {
          const playlistIds = results.map(item => item.id);
          detailedResults$ = this.youtubeDataService.fetchPlaylists(playlistIds);
        } else if (this.searchType === 'channels') {
          const channelIds = results.map(item => item.id);
          detailedResults$ = this.youtubeDataService.fetchChannels(channelIds);
        } else {
          throw new Error('Unknown search type.');
        }

        return detailedResults$.pipe(
          map((detailedItems: any) => {
            this.updatePageToken(response);  // Update the correct page token
            const mergedResults = results.map(result => {
              const detailedItem = detailedItems.items.find((item: any) => item.id === result.id);
              return { ...result, ...detailedItem };
            });
            return mergedResults;
          }),
          // Handle the correct page token for pagination
          map((finalResults: any[]) => {
            this.searchResults[this.searchType] = [...this.searchResults[this.searchType], ...finalResults];
            return this.searchResults[this.searchType];
          })
        );
      })
    ).subscribe({
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
      }
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

    // Add the correct page token for the current search type
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
