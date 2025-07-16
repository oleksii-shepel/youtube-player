import { catchError, createSubject, Stream } from '@actioncrew/streamix';
import { HttpClient, readJson } from '@actioncrew/streamix/http';

import { IYoutubeQueryParams } from '../interfaces/search-parameters';
import { inject, Injectable } from '@angular/core';
import { map, switchMap } from '@actioncrew/streamix';
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

  /**
   * @deprecated The relatedToVideoId parameter has been removed from YouTube API
   * Use fetchRelatedVideosByKeywords, fetchRelatedVideosByChannel, or fetchRelatedVideosByCategory instead
   */
  fetchRelatedVideos(videoId: string): Stream<any> {
    return this.fetchRelatedVideosByKeywords(videoId);
  }

  /**
   * Find related videos by extracting keywords from the original video's title and description
   */
  fetchRelatedVideosByKeywords(videoId: string, maxResults: number = 10): Stream<any> {
    return this.fetchVideos([videoId]).pipe(
      switchMap((videoResponse: any) => {
        if (!videoResponse.items || videoResponse.items.length === 0) {
          throw new Error('Video not found');
        }

        const video = videoResponse.items[0];
        const title = video.snippet.title;
        const description = video.snippet.description;

        // Extract keywords from title and description
        const keywords = this.extractKeywords(title, description);
        const searchQuery = keywords.slice(0, 3).join(' '); // Use top 3 keywords

        return this.search('search', {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults,
          // Exclude the original video from results
          videoId: `!${videoId}`,
        } as IYoutubeQueryParams);
      })
    );
  }

  /**
   * Find related videos from the same channel
   */
  fetchRelatedVideosByChannel(videoId: string, maxResults: number = 10): Stream<any> {
    return this.fetchVideos([videoId]).pipe(
      switchMap((videoResponse: any) => {
        if (!videoResponse.items || videoResponse.items.length === 0) {
          throw new Error('Video not found');
        }

        const channelId = videoResponse.items[0].snippet.channelId;

        return this.search('search', {
          part: 'snippet',
          channelId,
          type: 'video',
          maxResults,
          order: 'relevance',
        } as IYoutubeQueryParams);
      })
    );
  }

  /**
   * Find related videos by category
   */
  fetchRelatedVideosByCategory(videoId: string, maxResults: number = 10): Stream<any> {
    return this.fetchVideos([videoId]).pipe(
      switchMap((videoResponse: any) => {
        if (!videoResponse.items || videoResponse.items.length === 0) {
          throw new Error('Video not found');
        }

        const categoryId = videoResponse.items[0].snippet.categoryId;

        return this.search('search', {
          part: 'snippet',
          videoCategoryId: categoryId,
          type: 'video',
          maxResults,
          order: 'relevance',
        } as IYoutubeQueryParams);
      })
    );
  }

  /**
   * Find related videos using multiple strategies and combine results
   */
  fetchRelatedVideosAdvanced(videoId: string, maxResults: number = 15): Stream<any> {
    return this.fetchVideos([videoId]).pipe(
      switchMap((videoResponse: any) => {
        if (!videoResponse.items || videoResponse.items.length === 0) {
          throw new Error('Video not found');
        }

        const video = videoResponse.items[0];
        const title = video.snippet.title;
        const description = video.snippet.description;
        const channelId = video.snippet.channelId;
        const categoryId = video.snippet.categoryId;

        // Extract keywords
        const keywords = this.extractKeywords(title, description);
        const searchQuery = keywords.slice(0, 2).join(' ');

        // Create multiple search strategies
        const keywordSearch = this.search('search', {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults: Math.floor(maxResults / 3),
          order: 'relevance',
        } as IYoutubeQueryParams);

        const channelSearch = this.search('search', {
          part: 'snippet',
          channelId,
          type: 'video',
          maxResults: Math.floor(maxResults / 3),
          order: 'relevance',
        } as IYoutubeQueryParams);

        const categorySearch = this.search('search', {
          part: 'snippet',
          videoCategoryId: categoryId,
          type: 'video',
          maxResults: Math.floor(maxResults / 3),
          order: 'relevance',
        } as IYoutubeQueryParams);

        // Combine results (you might want to implement a proper merge strategy)
        return keywordSearch.pipe(
          map((keywordResults: any) => ({
            ...keywordResults,
            strategy: 'combined',
            sources: {
              keywords: keywordResults.items || [],
              // Note: In a real implementation, you'd want to properly combine all three searches
              // This is a simplified version for demonstration
            }
          }))
        );
      })
    );
  }

  /**
   * Search for videos by tags (if available in video metadata)
   */
  fetchRelatedVideosByTags(videoId: string, maxResults: number = 10): Stream<any> {
    return this.fetchVideos([videoId]).pipe(
      switchMap((videoResponse: any) => {
        if (!videoResponse.items || videoResponse.items.length === 0) {
          throw new Error('Video not found');
        }

        const video = videoResponse.items[0];
        const tags = video.snippet.tags;

        if (!tags || tags.length === 0) {
          // Fallback to keywords from title if no tags
          return this.fetchRelatedVideosByKeywords(videoId, maxResults);
        }

        // Use first few tags as search query
        const searchQuery = tags.slice(0, 3).join(' ');

        return this.search('search', {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults,
          order: 'relevance',
        } as IYoutubeQueryParams);
      })
    );
  }

  /**
   * Get videos from the same playlist (if the video is part of a playlist)
   */
  fetchRelatedVideosFromPlaylist(videoId: string, maxResults: number = 10): Stream<any> {
    // First search for playlists containing this video
    return this.search('search', {
      part: 'snippet',
      q: videoId,
      type: 'playlist',
      maxResults: 1,
    } as IYoutubeQueryParams).pipe(
      switchMap((playlistResponse: any) => {
        if (!playlistResponse.items || playlistResponse.items.length === 0) {
          throw new Error('No playlists found containing this video');
        }

        const playlistId = playlistResponse.items[0].id.playlistId;

        return this.fetchPlaylistItems(playlistId);
      })
    );
  }

  /**
   * Extract meaningful keywords from title and description
   */
  private extractKeywords(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
      'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
      'its', 'our', 'their', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'since', 'until',
      'while', 'so', 'because', 'if', 'then', 'than', 'when', 'where', 'why',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'can',
      'just', 'now', 'here', 'there', 'out', 'off', 'down', 'over', 'again',
      'further', 'then', 'once', 'video', 'watch', 'subscribe', 'like', 'comment'
    ]);

    // Extract words, filter stop words, and count frequency
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(word => !word.match(/^\d+$/)); // Remove pure numbers

    // Count word frequency
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
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

  fetchTrendingVideos(): Stream<any> {
    const params: IYoutubeQueryParams = {
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular'
    };

    return this.search('videos', params);
  }

  /**
   * Search videos with advanced filtering options
   */
  searchVideosAdvanced(options: {
    query: string;
    channelId?: string;
    categoryId?: string;
    duration?: 'short' | 'medium' | 'long';
    order?: 'relevance' | 'date' | 'rating' | 'viewCount' | 'title';
    publishedAfter?: string;
    publishedBefore?: string;
    maxResults?: number;
    pageToken?: string;
  }): Stream<any> {
    const params: IYoutubeQueryParams = {
      part: 'snippet',
      q: options.query,
      type: 'video',
      maxResults: options.maxResults || +this.maxResults,
      order: options.order || 'relevance',
      ...(options.channelId && { channelId: options.channelId }),
      ...(options.categoryId && { videoCategoryId: options.categoryId }),
      ...(options.duration && { videoDuration: options.duration }),
      ...(options.publishedAfter && { publishedAfter: options.publishedAfter }),
      ...(options.publishedBefore && { publishedBefore: options.publishedBefore }),
      ...(options.pageToken && { pageToken: options.pageToken }),
    };

    return this.search('search', params);
  }

  /**
   * Get video statistics and engagement metrics
   */
  fetchVideoStatistics(videoId: string): Stream<any> {
    return this.search('videos', {
      id: videoId,
      part: 'statistics,contentDetails,snippet'
    } as IYoutubeQueryParams & { id: string });
  }

  /**
   * Get channel statistics
   */
  fetchChannelStatistics(channelId: string): Stream<any> {
    return this.search('channels', {
      id: channelId,
      part: 'statistics,snippet,contentDetails'
    } as IYoutubeQueryParams & { id: string });
  }

  private buildHttpParams(queryParams: IYoutubeQueryParams): Record<string, string> {
    const params: Record<string, string> = {
      key: this.apiKey,
      part: 'snippet,id'
    };

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && value !== '') {
        params[key] = value.toString();
      }
    });

    return params;
  }
}
