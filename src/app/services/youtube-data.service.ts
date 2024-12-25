import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IYoutubeQueryParams } from "../interfaces/search-parameters";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})
export class YoutubeDataService {
  private readonly apiUrl = 'https://www.googleapis.com/youtube/v3/search';
  private readonly apiKey = environment.youtube.apiKey;
  private readonly maxResults = environment.youtube.maxResults;

  constructor(private http: HttpClient) {}

  search(queryParams: IYoutubeQueryParams): Observable<any> {
    const params = this.buildHttpParams(queryParams);
    return this.http.get(this.apiUrl, { params });
  }

  private buildHttpParams(queryParams: IYoutubeQueryParams): HttpParams {
    let params = new HttpParams().set('key', this.apiKey);
    params.append('maxResults', this.maxResults);

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            params = params.append(key, v);
          });
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return params;
  }
}
