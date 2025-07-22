import { inject, Injectable } from '@angular/core';
import { Authorization } from './authorization.service';
import { HttpClient, readJson } from '@actioncrew/streamix/http';
import { HTTP_CLIENT } from 'src/main';
import { Stream } from '@actioncrew/streamix';

@Injectable({ providedIn: 'root' })
export class Settings {
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly uploadUrl = 'https://www.googleapis.com/upload/youtube/v3';

  http: HttpClient;

  constructor(private authorization: Authorization) {
    this.http = inject<HttpClient>(HTTP_CLIENT);
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.authorization.getAccessToken()}`,
      'Content-Type': 'application/json'
    };
  }

  /** 🧑‍🎤 Get current user's channel */
  getMyChannel(): Stream<any> {
    return this.http.get(`${this.baseUrl}/channels`, readJson, {
      params: {
        part: 'snippet,statistics,brandingSettings',
        mine: 'true'
      },
      headers: this.authHeaders()
    });
  }

  /** 📺 List user's playlists */
  listPlaylistsPaginated(pageToken?: string): Stream<any> {
    const params: any = {
      part: 'snippet,status',
      mine: 'true',
      maxResults: '10',
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    return this.http.get(`${this.baseUrl}/playlists`, readJson, {
      params,
      headers: this.authHeaders(),
    });
  }

  /** 📄 List user's subscriptions with pagination */
  listSubscriptionsPaginated(pageToken?: string): Stream<any> {
    const params: any = {
      part: 'snippet',
      mine: 'true',
      maxResults: '10',
      order: 'alphabetical'
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    return this.http.get(`${this.baseUrl}/subscriptions`, readJson, {
      params,
      headers: this.authHeaders(),
    });
  }

  /** ➕ Create a playlist */
  createPlaylist(title: string, description = '', privacyStatus: 'private' | 'public' | 'unlisted' = 'private'): Stream<any> {
    return this.http.post(`${this.baseUrl}/playlists?part=snippet,status`, readJson, {
      body: {
        snippet: {
          title: title,
          description: description
        },
        status: {
          privacyStatus: privacyStatus
        }
      },
      headers: this.authHeaders()
    });
  }

  /** 🗑️ Delete a playlist */
  deletePlaylist(playlistId: string): Stream<any> {
    return this.http.delete(`${this.baseUrl}/playlists`, readJson, {
      params: { id: playlistId },
      headers: this.authHeaders()
    });
  }

  /** 🎞️ Add video to playlist */
  addVideoToPlaylist(videoId: string, playlistId: string): Stream<any> {
    return this.http.post(`${this.baseUrl}/playlistItems`, readJson, {
      body: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId
          }
        }
      },
      headers: this.authHeaders()
    });
  }

  /** 📄 List subscriptions */
  listSubscriptions(): Stream<any> {
    return this.http.get(`${this.baseUrl}/subscriptions`, readJson, {
      params: {
        part: 'snippet',
        mine: 'true',
        maxResults: '50'
      },
      headers: this.authHeaders()
    });
  }

  /** ➕ Subscribe to a channel */
  subscribeToChannel(channelId: string): Stream<any> {
    return this.http.post(`${this.baseUrl}/subscriptions`, readJson, {
      body: {
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId
          }
        }
      },
      headers: this.authHeaders()
    });
  }

  /** 🗑️ Unsubscribe from a channel */
  unsubscribe(subscriptionId: string): Stream<any> {
    return this.http.delete(`${this.baseUrl}/subscriptions`, readJson, {
      params: { id: subscriptionId },
      headers: this.authHeaders()
    });
  }

  /** 🆙 Upload video (stub for resumable upload) */
  initiateVideoUpload(title: string, description: string): Stream<any> {
    return this.http.post(`${this.uploadUrl}/videos`, readJson, {
      params: {
        uploadType: 'resumable',
        part: 'snippet,status'
      },
      body: {
        snippet: { title, description },
        status: { privacyStatus: 'private' }
      },
      headers: {
        ...this.authHeaders(),
        'X-Upload-Content-Type': 'video/*'
      }
    });
  }

  /** ✏️ Update video metadata */
  updateVideo(videoId: string, title: string, description: string): Stream<any> {
    return this.http.put(`${this.baseUrl}/videos`, readJson, {
      params: {
        part: 'snippet'
      },
      body: {
        id: videoId,
        snippet: {
          title,
          description,
          categoryId: '22' // People & Blogs (example)
        }
      },
      headers: this.authHeaders()
    });
  }

  /** 🗑️ Delete video */
  deleteVideo(videoId: string): Stream<any> {
    return this.http.delete(`${this.baseUrl}/videos`, readJson, {
      params: { id: videoId },
      headers: this.authHeaders()
    });
  }

  /** 💬 Post a comment (optional, not full comment flow) */
  postComment(videoId: string, text: string): Stream<any> {
    return this.http.post(`${this.baseUrl}/commentThreads`, readJson, {
      body: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text
            }
          }
        }
      },
      headers: this.authHeaders()
    });
  }
}
