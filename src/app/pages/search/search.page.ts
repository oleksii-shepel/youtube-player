import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-youtube-search',
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
        <ion-input [(ngModel)]="searchQuery" placeholder="Enter search query" (ionInput)="onSearchQueryChange($event)"></ion-input>
      </ion-item>

      <ion-chip *ngFor="let suggestion of suggestions" (click)="selectSuggestion(suggestion)">
        {{ suggestion }}
      </ion-chip>

      <ion-item>
        <ion-button (click)="performSearch()">Search</ion-button>
      </ion-item>

      <ion-list>
        <ion-item *ngFor="let result of searchResults">
          <ion-label>
            <h2>{{ result.title }}</h2>
            <p>{{ result.description }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styleUrls: ['./search.page.scss'],
  standalone: false
})
export class SearchPage {
  apiKey: string = 'YOUR_YOUTUBE_API_KEY';
  searchQuery: string = '';
  searchType: string = 'video';
  searchResults: any[] = [];
  suggestions: string[] = [];

  constructor(private http: HttpClient) {}

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

  fetchSuggestions(query: string): Observable<string[]> {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((response: any) => {
        const suggestions = JSON.parse(response)[1];
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

  performSearch() {
    const url = this.buildSearchUrl();
    this.http.get(url).subscribe((response: any) => {
      this.searchResults = this.mapResults(response);
    });
  }

  buildSearchUrl(): string {
    const baseUrl = 'https://www.googleapis.com/youtube/v3/search';
    const commonParams = `part=snippet&maxResults=10&q=${encodeURIComponent(this.searchQuery)}&key=${this.apiKey}`;

    switch (this.searchType) {
      case 'video':
        return `${baseUrl}?${commonParams}&type=video`;
      case 'playlist':
        return `${baseUrl}?${commonParams}&type=playlist`;
      case 'channel':
        return `${baseUrl}?${commonParams}&type=channel`;
      default:
        return `${baseUrl}?${commonParams}&type=video`;
    }
  }

  mapResults(response: any): any[] {
    return response.items.map((item: any) => {
      return {
        title: item.snippet.title,
        description: item.snippet.description
      };
    });
  }
}
