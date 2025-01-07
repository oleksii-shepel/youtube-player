import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { GoogleSuggestionsService } from 'src/app/services/google-suggestions.service';

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
          <ion-segment-button value="video">Videos</ion-segment-button>
          <ion-segment-button value="playlist">Playlists</ion-segment-button>
          <ion-segment-button value="channel">Channels</ion-segment-button>
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
      <app-youtube-video *ngFor="let video of searchResults" [videoData]="video" [isCompact]="false"></app-youtube-video>
      </ion-list>
    </ion-content>
  `,
  styleUrls: ['./search.page.scss'],
  standalone: false
})
export class SearchPage {
  apiKey: string = environment.youtube.apiKey;
  searchQuery: string = '';
  searchType: string = 'video';
  searchResults: any[] = [];
  suggestions: string[] = [];

  // Filters and active selections
  videoFilters = {
    durations: [
      { label: 'Short (< 4 mins)', value: 'short' },
      { label: 'Medium (4-20 mins)', value: 'medium' },
      { label: 'Long (> 20 mins)', value: 'long' },
    ],
    resolutions: [
      { label: 'HD', value: 'hd' },
      { label: 'SD', value: 'sd' },
    ],
    liveStatuses: [
      { label: 'Live', value: 'live' },
      { label: 'Upcoming', value: 'upcoming' },
      { label: 'Archived', value: 'archived' },
    ],
  };

  playlistFilters = {
    types: [
      { label: 'All', value: 'all' },
      { label: 'Favorites', value: 'favorites' },
      { label: 'Custom', value: 'custom' },
      { label: 'Public', value: 'public' },
      { label: 'Private', value: 'private' },
      { label: 'Upcoming', value: 'upcoming' },
    ],
  };

  channelFilters = {
    topics: [
      { label: 'Music', value: '/m/04rlf' },
      { label: 'Gaming', value: '/m/0bzvm2' },
      { label: 'Sports', value: '/m/06ntj' },
      { label: 'Education', value: '/m/02jjt' },
      { label: 'News', value: '/m/0k4d' },
      { label: 'Technology', value: '/m/0k4d' },
      { label: 'Movies', value: '/m/01mjl' },
      { label: 'Comedies', value: '/m/02kz58' },
      { label: 'Lifestyle', value: '/m/019_rr' },
    ],
  };

  activeFilters: any = {
    duration: '',
    resolution: '',
    live: '',
    playlistType: '',
    topic: [],
  };

  constructor(private http: HttpClient, private googleSuggestionsService: GoogleSuggestionsService) {}

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
      switchMap((response: any) => {
        const suggestions = response;
        return new Observable<string[]>((observer) => {
          observer.next(suggestions);
          observer.complete();
        });
      })
    );
  }

  selectSuggestion(suggestion: string) {
    this.searchQuery = suggestion;
    this.suggestions = [];
    this.performSearch();
  }

  toggleFilter(filterKey: string, value: any) {
    if (filterKey === 'topic') {
      const index = this.activeFilters[filterKey].indexOf(value);
      if (index === -1) {
        this.activeFilters[filterKey].push(value);
      } else {
        this.activeFilters[filterKey].splice(index, 1);
      }
    } else {
      this.activeFilters[filterKey] = this.activeFilters[filterKey] === value ? '' : value;
    }
  }

  performSearch() {
    const url = this.buildSearchUrl();
    this.http.get(url).subscribe((response: any) => {
      this.searchResults = this.mapResults(response);
    });
  }

  buildSearchUrl(): string {
    const baseUrl = 'https://www.googleapis.com/youtube/v3/search';
    let commonParams = `part=snippet&maxResults=10&q=${encodeURIComponent(this.searchQuery)}&key=${this.apiKey}&type=${this.searchType}`;

    if (this.searchType === 'video') {
      if (this.activeFilters.duration) {
        commonParams += `&videoDuration=${this.activeFilters.duration}`;
      }
      if (this.activeFilters.resolution) {
        commonParams += `&videoDefinition=${this.activeFilters.resolution}`;
      }
      if (this.activeFilters.live) {
        commonParams += `&eventType=${this.activeFilters.live}`;
      }
    } else if (this.searchType === 'playlist') {
      if (this.activeFilters.playlistType) {
        commonParams += `&playlistType=${this.activeFilters.playlistType}`;
      }
    } else if (this.searchType === 'channel') {
      if (this.activeFilters.topic.length) {
        commonParams += `&topicId=${this.activeFilters.topic.join(',')}`;
      }
    }

    return `${baseUrl}?${commonParams}`;
  }

  mapResults(response: any): any[] {
    return response.items.map((item: any) => ({
      title: item.snippet.title,
      description: item.snippet.description,
    }));
  }
}
