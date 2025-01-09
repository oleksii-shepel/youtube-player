import { IYoutubeQueryParams } from './../interfaces/search-parameters';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class YoutubeDataService {
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly apiKey = environment.youtube.apiKey;
  private readonly maxResults = environment.youtube.maxResults;

  constructor(private http: HttpClient) {}

  /**
   * Perform a generic search for the specified endpoint.
   */
  search(endpoint: string, queryParams: IYoutubeQueryParams): Observable<any> {
    const params = this.buildHttpParams(queryParams);

    // Ensure the correct URL and parameters are being used
    let url = `${this.baseUrl}/${endpoint}`;

    params.set('part', 'snippet,id');

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
  fetchVideos(ids: string[]): Observable<any> {
    return this.search('videos', {
      id: ids.join(','),
      part: 'snippet,contentDetails,statistics'
    } as IYoutubeQueryParams & { id: string });
  }

  /**
   * Fetch detailed channel information.
   */
  fetchChannels(ids: string[]): Observable<any> {
    return this.search('channels', {
      id: ids.join(','),
      part: 'snippet,contentDetails,statistics'
    } as IYoutubeQueryParams & { id: string });
  }

  /**
   * Fetch detailed playlist information.
   */
  fetchPlaylists(ids: string[]): Observable<any> {
    return this.search('playlists', {
      id: ids.join(','),
      part: 'snippet,contentDetails'
    } as IYoutubeQueryParams & { id: string });
  }

  private buildHttpParams(queryParams: IYoutubeQueryParams): HttpParams {
    let params = new HttpParams()
      .set('key', this.apiKey);

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return params;
  }
}
