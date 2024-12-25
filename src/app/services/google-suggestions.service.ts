// google-suggestions.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleSuggestionsService {
  constructor(private http: HttpClient) {}

  getSuggestions(query: string): Observable<string[]> {
    // Using a CORS proxy to handle the request
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(query)}`;

    return this.http.jsonp(url, 'callback').pipe(
      map((response: any) => response[1] || [])
    );
  }
}
