import { inject, Injectable } from '@angular/core';
import { Authorization } from './authorization.service';
import { HttpClient, readJson } from '@actioncrew/streamix/http';
import { HTTP_CLIENT } from 'src/main';
import { Stream, firstValueFrom } from '@actioncrew/streamix';
import ISO6391 from 'iso-639-1';
import * as countries from 'i18n-iso-countries';
import englishCountries from 'i18n-iso-countries/langs/en.json';
import { Country, Language } from '../interfaces/settings';
import countryLanguages from '../components/country/country-languages.json';

@Injectable({ providedIn: 'root' })
export class Helper {
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly uploadUrl = 'https://www.googleapis.com/upload/youtube/v3';

  http: HttpClient;

  constructor(private authorization: Authorization) {
    this.http = inject<HttpClient>(HTTP_CLIENT);
    countries.registerLocale(englishCountries);
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.authorization.getAccessToken()?.accessToken ?? ''}`,
      'Content-Type': 'application/json'
    };
  }

  /** 🧑‍🎤 Get current user's channel */
  getMyChannel(): Stream<any> {
    return this.http.get(`${this.baseUrl}/channels`, {
      params: {
        part: 'snippet,statistics,brandingSettings',
        mine: 'true'
      },
      headers: this.authHeaders()
    }, readJson);
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

    return this.http.get(`${this.baseUrl}/playlists`, {
      params,
      headers: this.authHeaders(),
    }, readJson);
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

    return this.http.get(`${this.baseUrl}/subscriptions`, {
      params,
      headers: this.authHeaders(),
    }, readJson);
  }

  /** ➕ Create a playlist */
  createPlaylist(title: string, description = '', privacyStatus: 'private' | 'public' | 'unlisted' = 'private'): Stream<any> {
    return this.http.post(`${this.baseUrl}/playlists?part=snippet,status`, {
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
    }, readJson);
  }

  /** 🗑️ Delete a playlist */
  deletePlaylist(playlistId: string): Stream<any> {
    return this.http.delete(`${this.baseUrl}/playlists`, {
      params: { id: playlistId },
      headers: this.authHeaders()
    }, readJson);
  }

  /** 🎞️ Add video to playlist */
  addVideoToPlaylist(videoId: string, playlistId: string): Stream<any> {
    return this.http.post(`${this.baseUrl}/playlistItems`, {
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
    }, readJson);
  }

  /** 📄 List subscriptions */
  listSubscriptions(): Stream<any> {
    return this.http.get(`${this.baseUrl}/subscriptions`, {
      params: {
        part: 'snippet',
        mine: 'true',
        maxResults: '50'
      },
      headers: this.authHeaders()
    }, readJson);
  }

  /** ➕ Subscribe to a channel */
  subscribeToChannel(channelId: string): Stream<any> {
    return this.http.post(`${this.baseUrl}/subscriptions`, {
      body: {
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId
          }
        }
      },
      headers: this.authHeaders()
    }, readJson);
  }

  /** 🗑️ Unsubscribe from a channel */
  unsubscribe(subscriptionId: string): Stream<any> {
    return this.http.delete(`${this.baseUrl}/subscriptions`, {
      params: { id: subscriptionId },
      headers: this.authHeaders()
    }, readJson);
  }

  /** 🆙 Upload video (stub for resumable upload) */
  initiateVideoUpload(title: string, description: string): Stream<any> {
    return this.http.post(`${this.uploadUrl}/videos`, {
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
    }, readJson);
  }

  /** ✏️ Update video metadata */
  updateVideo(videoId: string, title: string, description: string): Stream<any> {
    return this.http.put(`${this.baseUrl}/videos`, {
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
    }, readJson);
  }

  /** 🗑️ Delete video */
  deleteVideo(videoId: string): Stream<any> {
    return this.http.delete(`${this.baseUrl}/videos`, {
      params: { id: videoId },
      headers: this.authHeaders()
    },
    readJson);
  }

  /** 💬 Post a comment (optional, not full comment flow) */
  postComment(videoId: string, text: string): Stream<any> {
    return this.http.post(`${this.baseUrl}/commentThreads`, {
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
    }, readJson);
  }

  /** 🌍 Detect user's region and language via geolocation and IP using http.get */
  async detectRegionAndLanguage(): Promise<{ country: Country; language: Language }> {
    const fallback = async (): Promise<{ country: Country; language: Language }> => {
      try {
        const data: any = await firstValueFrom(this.http.get('https://ipapi.co/json', readJson));
        const countryCode = data.country || 'US';
        const languageCodes = (countryLanguages as any)[countryCode] || [];
        const languages: Language[] = languageCodes.map((langCode: string) => ({
          code: langCode,
          name: ISO6391.getName(langCode) || langCode.toUpperCase(),
          nativeName: ISO6391.getNativeName(langCode) || ISO6391.getName(langCode) || langCode.toUpperCase(),
        }));

        return {
          country: {
            code: countryCode,
            name: countries.getName(countryCode, 'en') || countryCode,
            nativeName: countries.getName(countryCode, 'en') || countryCode,
            languages,
          },
          language: {
            code: languageCodes[0] || 'en',
            name: ISO6391.getName(languageCodes[0]) || 'English',
            nativeName: ISO6391.getNativeName(languageCodes[0]) || 'English',
          },
        };
      } catch {
        // hardcoded fallback
        return {
          country: {
            code: 'US',
            name: 'United States',
            nativeName: 'United States',
            languages: [
              { code: 'en', name: 'English', nativeName: 'English' },
            ],
          },
          language: { code: 'en', name: 'English', nativeName: 'English' },
        };
      }
    };

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });

        const { latitude, longitude } = position.coords;
        const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

        const data: any = await firstValueFrom(this.http.get(geoUrl, readJson));
        const countryCode = data.countryCode || 'US';

        const languageCodes = (countryLanguages as any)[countryCode] || [];
        const browserLang = (navigator.language || 'en').split('-')[0];
        const languageCode = languageCodes.includes(browserLang)
          ? browserLang
          : languageCodes[0] || 'en';

        const languages: Language[] = languageCodes.map((langCode: string) => ({
          code: langCode,
          name: ISO6391.getName(langCode) || langCode.toUpperCase(),
          nativeName: ISO6391.getNativeName(langCode) || ISO6391.getName(langCode) || langCode.toUpperCase(),
        }));

        return {
          country: {
            code: countryCode,
            name: countries.getName(countryCode, 'en') || countryCode,
            nativeName: countries.getName(countryCode, 'en') || countryCode,
            languages,
          },
          language: {
            code: languageCode,
            name: ISO6391.getName(languageCode) || 'English',
            nativeName: ISO6391.getNativeName(languageCode) || 'English',
          },
        };
      } catch {
        return fallback();
      }
    } else {
      return fallback();
    }
  }
}
