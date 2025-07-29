import { inject, Injectable } from '@angular/core';
import { Authorization } from './authorization.service';
import { HttpClient, readJson } from '@actioncrew/streamix/http';
import { HTTP_CLIENT } from 'src/main';
import { Stream, Subject, createBehaviorSubject, createSubject, firstValueFrom } from '@actioncrew/streamix';
import ISO6391 from 'iso-639-1';
import * as countries from 'i18n-iso-countries';
import englishCountries from 'i18n-iso-countries/langs/en.json';
import { AboutSettings, ApiConfigSettings, AppearanceSettings, Country, Language, PlaylistsSettings, RegionAndLanguageSettings, SubscriptionsSettings, UserInfoSettings } from '../interfaces/settings';
import { Storage } from '@ionic/storage-angular';


@Injectable({ providedIn: 'root' })
export class Settings {
  appearance: Subject<AppearanceSettings>;
  userInfo: Subject<UserInfoSettings>;
  regionLanguage: Subject<RegionAndLanguageSettings>;
  playlists: Subject<PlaylistsSettings>;
  subscriptions: Subject<SubscriptionsSettings>;
  apiConfig: Subject<ApiConfigSettings>;
  about: Subject<AboutSettings>;

  constructor(private storage: Storage) {
    this.appearance = createSubject<AppearanceSettings>();
    this.userInfo = createSubject<AppearanceSettings>();
    this.regionLanguage = createSubject<RegionAndLanguageSettings>();
    this.playlists = createSubject<PlaylistsSettings>();
    this.subscriptions = createSubject<SubscriptionsSettings>();
    this.apiConfig = createSubject<ApiConfigSettings>();
    this.about = createSubject<AboutSettings>();
  }
}
