// google-suggestions.service.ts
import { Injectable } from '@angular/core';
import { map, Stream } from '@actioncrew/streamix';
import { jsonp } from '@actioncrew/streamix/networking';

@Injectable({
  providedIn: 'root'
})
export class GoogleSuggestionsService {
  constructor() {}

  getSuggestions(query: string): Stream<string[]> {
    // Using a CORS proxy to handle the request
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(query)}`;

    return jsonp(url, 'callback').pipe(
      map((response: any) => response[1] || [])
    );
  }
}
