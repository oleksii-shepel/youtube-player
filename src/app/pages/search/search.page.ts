import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GoogleSuggestionsService } from 'src/app/services/google-suggestions.service';
import { YoutubeDataService } from 'src/app/services/youtube-data.service';  // Import YoutubeDataService

@Component({
  selector: 'app-search',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>YouTube Search</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-item>
        <ion-segment [(ngModel)]="searchType">
          <ion-segment-button value="videos">Videos</ion-segment-button>
          <ion-segment-button value="playlists">Playlists</ion-segment-button>
          <ion-segment-button value="channels">Channels</ion-segment-button>
        </ion-segment>
      </ion-item>

      <ion-item>
        <ion-input
          [(ngModel)]="searchQuery"
          placeholder="Enter search query"
          (ionInput)="onSearchQueryChange($event)"
        ></ion-input>
      </ion-item>

      <!-- Filters Section -->
      <app-filter
        [searchType]="searchType"
        (filtersChanged)="onFiltersChanged($event)">
      </app-filter>

      <ion-chip *ngFor="let suggestion of suggestions" (click)="selectSuggestion(suggestion)">
        {{ suggestion }}
      </ion-chip>

      <ion-item>
        <ion-button (click)="performSearch()">Search</ion-button>
      </ion-item>

      <!-- Adaptive Grid -->
      <div class="adaptive-grid">
        <ng-container *ngIf="searchType === 'videos'">
          <app-youtube-video
            *ngFor="let video of searchResults['videos']"
            [videoData]="video"
            [isCompact]="false">
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

  constructor(
    private googleSuggestionsService: GoogleSuggestionsService,
    private youtubeDataService: YoutubeDataService // Inject YoutubeDataService
  ) {}

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

  fetchSuggestions(query: string): Observable<string[]> {
    return this.googleSuggestionsService.getSuggestions(query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((response: any) => new Observable<string[]>((observer) => {
        observer.next(response);
        observer.complete();
      }))
    );
  }

  selectSuggestion(suggestion: string) {
    this.searchQuery = suggestion;
    this.suggestions = [];
    this.performSearch();
  }

  performSearch() {
    const params = this.buildSearchParams();

    this.youtubeDataService.search('search', params).pipe(
      switchMap((response: any) => {
        const results = this.mapResults(response);

        let detailedResults$: Observable<any>;

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
          switchMap((detailedItems: any) => {
            this.updatePageToken(response);  // Update the correct page token

            const mergedResults = results.map(result => {
              const detailedItem = detailedItems.items.find((item: any) => item.id === result.id);
              return { ...result, ...detailedItem };
            });
            return new Observable<any[]>((observer) => {
              observer.next(mergedResults);
              observer.complete();
            });
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
        let detailedResults$: Observable<any>;

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
          switchMap((detailedItems: any) => {
            this.updatePageToken(response);  // Update the correct page token
            const mergedResults = results.map(result => {
              const detailedItem = detailedItems.items.find((item: any) => item.id === result.id);
              return { ...result, ...detailedItem };
            });
            return new Observable<any[]>((observer) => {
              observer.next(mergedResults);
              observer.complete();
            });
          }),
          // Handle the correct page token for pagination
          switchMap((finalResults: any[]) => {
            this.searchResults[this.searchType] = [...this.searchResults[this.searchType], ...finalResults];
            return new Observable<void>((observer) => {
              observer.next();
              observer.complete();
            });
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
}
