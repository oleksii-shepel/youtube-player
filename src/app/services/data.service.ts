import { catchError, createSubject, Stream } from '@actioncrew/streamix';
import { HttpClient, readJson } from '@actioncrew/streamix/http';

import { IYoutubeQueryParams } from '../interfaces/search-parameters';
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
  searchError$ = createSubject<string>();

  constructor() {
    this.http = inject<HttpClient>(HTTP_CLIENT);
  }

  /**
   * Perform a generic search for the specified endpoint.
   */
  search(endpoint: string, queryParams: IYoutubeQueryParams): Stream<any> {
    const params = this.buildHttpParams(queryParams);
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.get(url, readJson, { params }).pipe(
      map((response: any) => ({
        ...response,
        nextPageToken: response.nextPageToken,
        prevPageToken: response.prevPageToken,
      })),
      catchError((err) => {
        this.searchError$.next(this.parseErrorMessage(err));
      })
    );
  }

  private parseErrorMessage(err: any): string {
    const rawMsg = err?.message ?? '';

    if (rawMsg.includes('403')) {
      return 'Access denied (403). Possibly over quota or restricted key.';
    }
    if (rawMsg.includes('404')) {
      return 'Resource not found (404).';
    }
    if (rawMsg.includes('400')) {
      return 'Bad request (400). Check query parameters.';
    }
    if (rawMsg.includes('401')) {
      return 'Unauthorized (401). Invalid API key?';
    }
    if (rawMsg.includes('500')) {
      return 'Internal server error (500). Try again later.';
    }
    if (rawMsg.includes('HTTP Error')) {
      return `YouTube API: ${rawMsg}`;
    }

    return 'Unknown error during search. Please try again.';
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

  fetchVideoComments(videoId: string): Stream<any> {
    return this.search('commentThreads', {
      part: 'snippet',
      videoId,
      maxResults: 50,
      order: 'relevance',
    } as IYoutubeQueryParams & { videoId: string });
  }

  fetchRelatedVideos(videoId: string): Stream<any> {
    return this.search('search', {
      part: 'snippet',
      relatedToVideoId: videoId,
      type: 'video',
      maxResults: 10,
    } as IYoutubeQueryParams);
  }

  /**
   * Fetch full metadata for a specific playlist.
   */
  fetchPlaylistById(id: string): Stream<any> {
    return this.fetchPlaylists([id]);
  }

  /**
   * Fetch playlist items (videos in playlist).
   */
  fetchPlaylistItems(playlistId: string, pageToken?: string | null): Stream<any> {
    const params: IYoutubeQueryParams = {
      playlistId,
      part: 'snippet,contentDetails',
      maxResults: 50,
      ...(pageToken ? { pageToken } : {})
    };
    return this.search('playlistItems', params);
  }

  fetchPlaylistsByChannel(channelId: string, pageToken?: string): Stream<any> {
    const params: IYoutubeQueryParams = {
      part: 'snippet,contentDetails',
      channelId,
      ...(pageToken ? { pageToken } : {})
    };

    return this.search('playlists', params);
  }

  fetchTrendingVideos(
  ): Stream<any> {
    const params: IYoutubeQueryParams = {
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular'
    };

    // We use 'videos' endpoint with chart=mostPopular
    return this.search('videos', params);
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
