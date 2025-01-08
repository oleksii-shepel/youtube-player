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

      <ion-list>
        <ng-container *ngIf="searchType === 'videos'">
          <app-youtube-video *ngFor="let video of searchResults" [videoData]="video" [isCompact]="false"></app-youtube-video>
        </ng-container>
        <ng-container *ngIf="searchType === 'playlists'">
          <app-youtube-playlist *ngFor="let playlist of searchResults" [playlistData]="playlist"></app-youtube-playlist>
        </ng-container>
        <ng-container *ngIf="searchType === 'channels'">
          <app-youtube-channel *ngFor="let channel of searchResults" [channelData]="channel"></app-youtube-channel>
        </ng-container>
      </ion-list>
    </ion-content>
  `,
  styleUrls: ['./search.page.scss'],
  standalone: false
})
export class SearchPage {
  searchQuery: string = '';
  searchType: string = 'videos'; // Default to video
  searchResults: any[] = [];
  suggestions: string[] = [];
  pageToken: string = '';

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
    // Build parameters for the search
    const params = this.buildSearchParams();

    // Perform search with type and params
    this.youtubeDataService.search('search', params).pipe(
      switchMap((response: any) => {
        // Step 1: Map search results to extract IDs
        const results = this.mapResults(response);
        let detailedResults$: Observable<any>;

        // Step 2: Based on search type, fetch detailed information using the IDs
        if (this.searchType === 'videos') {
          const videoIds = results.map(item => item.id);  // Extract video IDs
          detailedResults$ = this.youtubeDataService.fetchVideos(videoIds);  // Fetch detailed video info
        } else if (this.searchType === 'playlists') {
          const playlistIds = results.map(item => item.id);  // Extract playlist IDs
          detailedResults$ = this.youtubeDataService.fetchPlaylists(playlistIds);  // Fetch detailed playlist info
        } else if (this.searchType === 'channels') {
          const channelIds = results.map(item => item.id);  // Extract channel IDs
          detailedResults$ = this.youtubeDataService.fetchChannels(channelIds);  // Fetch detailed channel info
        } else {
          throw new Error('Unknown search type.');
        }

        // Step 3: Combine the basic and detailed results
        return detailedResults$.pipe(
          switchMap((detailedItems: any) => {
            return new Observable<any[]>((observer) => {
              const mergedResults = results.map(result => {
                const detailedItem = detailedItems.items.find((item: any) => item.id === result.id);
                return {
                  ...result,
                  ...detailedItem,
                };
              });
              observer.next(mergedResults);  // Emit combined results
              observer.complete();
            });
          })
        );
      })
    ).subscribe((finalResults: any[]) => {
      this.searchResults = finalResults;  // Update the search results with detailed info
    });
  }

  buildSearchParams() {
    const params: any = {
      q: this.searchQuery,
      maxResults: 10,
      pageToken: this.pageToken,
    };

    if (!this.pageToken || this.pageToken === '') {
      delete params.pageToken;
    }

    if (this.searchType === 'videos') {
      params.type = 'video';  // Specify search for videos
      // Optionally, if there’s a filter needed, such as 'chart' for top videos
      params.chart = 'mostPopular';  // Example filter for most popular videos
    } else if (this.searchType === 'playlists') {
      params.type = 'playlist';  // Specify search for playlists
    } else if (this.searchType === 'channels') {
      params.type = 'channel';  // Specify search for channels
      // Optionally add filters for channels (e.g., 'id', 'myRating')
      params.myRating = 'like';  // Example filter for channels rated by user
    }

    return params;
  }

  mapResults(response: any): any[] {
    return response.items.map((item: any) => ({
      id: item.id.videoId || item.id.playlistId || item.id.channelId, // Assuming the id field varies based on search type
    }));
  }
}
