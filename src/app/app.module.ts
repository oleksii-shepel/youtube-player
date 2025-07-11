import { DirectiveModule } from './directives/index';
import { PlaylistComponent } from './components/playlist/playlist.component';
import { InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './components/app/app.component';
import { AppRoutingModule } from './app-routing.module';
import { createHttpClient } from '@actioncrew/streamix/http';
import { ShrinkNumberPipe, ToFriendlyDurationPipe } from './pipes';
import { YoutubePlayerComponent } from './components/youtube-player/youtube-player.component';
import { PlaylistTrackComponent } from './components/playlist-track/playlist-track.component';
import { RecorderComponent } from "./components/recorder/recorder.component";

export const HTTP_CLIENT = new InjectionToken('HttpClient');

@NgModule({
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, DirectiveModule, ShrinkNumberPipe, ToFriendlyDurationPipe, YoutubePlayerComponent, RecorderComponent],
  exports: [AppComponent, PlaylistComponent, PlaylistTrackComponent],
  declarations: [AppComponent, PlaylistComponent, PlaylistTrackComponent],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_CLIENT, useFactory: () => createHttpClient() },
    // provideHttpClient(withInterceptorsFromDi(), withJsonpSupport())
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
