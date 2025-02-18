import { HttpClient, Stream } from '@actioncrew/streamix';
import { IYoutubeQueryParams } from './../interfaces/search-parameters';
import { inject, Injectable } from '@angular/core';
import { map } from '@actioncrew/streamix';
import { environment } from 'src/environments/environment';
import { HTTP_CLIENT } from '../app.module';

@Injectable({
  providedIn: 'root',
})
export class YoutubeDataService {
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly apiKey = environment.youtube.apiKey;
  private readonly maxResults = environment.youtube.maxResults;
  private http: HttpClient;

  constructor() {
    this.http = inject<HttpClient>(HTTP_CLIENT);
  }

  /**
   * Perform a generic search for the specified endpoint.
   */
  search(endpoint: string, queryParams: IYoutubeQueryParams): Stream<any> {

    const params = this.buildHttpParams(queryParams);

    // Ensure the correct URL and parameters are being used
    let url = `${this.baseUrl}/${endpoint}`;

    return this.http.get(url, { params }).pipe(
      map((response: any) => ({
        ...response,
        nextPageToken: response.nextPageToken,
        prevPageToken: response.prevPageToken,
      }))
    );
  }

  /**
   * Fetch detailed video information.
   */
  fetchVideos(ids: string[]): Stream<any> {
    return this.search('videos', {
      id: ids.join(','),
      part: 'snippet,contentDetails,statistics'
    } as IYoutubeQueryParams & { id: string });
  }

  /**
   * Fetch detailed channel information.
   */
  fetchChannels(ids: string[]): Stream<any> {
    return this.search('channels', {
      id: ids.join(','),
      part: 'snippet,contentDetails,statistics'
    } as IYoutubeQueryParams & { id: string });
  }

  /**
   * Fetch detailed playlist information.
   */
  fetchPlaylists(ids: string[]): Stream<any> {
    return this.search('playlists', {
      id: ids.join(','),
      part: 'snippet,contentDetails'
    } as IYoutubeQueryParams & { id: string });
  }

  private buildHttpParams(queryParams: IYoutubeQueryParams): Record<string, string> {
    // Initialize the parameters with the API key

    const params: Record<string, string> = {
      key: this.apiKey,
      part: 'snippet,id'
    };

    // Iterate over the queryParams and add each parameter to the params object
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && value !== '') {
        params[key] = value.toString();
      }
    });

    // Return the constructed params object
    return params;
  }
}
