import { PlaylistComponent } from './components/playlist/playlist.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './components/app/app.component';
import { AppRoutingModule } from './app-routing.module';
import { provideHttpClient, withInterceptorsFromDi, withJsonpSupport } from '@angular/common/http';
import { ShrinkNumberPipe, ToFriendlyDurationPipe } from './pipes';
import { YoutubePlayerComponent } from './components/youtube-player/youtube-player.component';
import { PlaylistTrackComponent } from './components/playlist-track/playlist-track.component';

@NgModule({
  declarations: [AppComponent, PlaylistComponent, PlaylistTrackComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ShrinkNumberPipe, ToFriendlyDurationPipe, YoutubePlayerComponent],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideHttpClient(withInterceptorsFromDi(), withJsonpSupport())],
  bootstrap: [AppComponent],
})
export class AppModule {}
