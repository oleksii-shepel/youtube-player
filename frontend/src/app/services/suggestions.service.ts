// google-suggestions.service.ts
import { Injectable } from '@angular/core';
import { map, Stream } from '@epikodelabs/streamix';
import { jsonp } from '@epikodelabs/streamix/networking';

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
