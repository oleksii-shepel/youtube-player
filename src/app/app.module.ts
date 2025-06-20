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
import { SortableDirective } from './directives/sortable/sortable.directive';

export const HTTP_CLIENT = new InjectionToken('HttpClient');

@NgModule({
  declarations: [AppComponent, PlaylistComponent, PlaylistTrackComponent, SortableDirective],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ShrinkNumberPipe, ToFriendlyDurationPipe, YoutubePlayerComponent],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_CLIENT, useFactory: () => createHttpClient() },
    // provideHttpClient(withInterceptorsFromDi(), withJsonpSupport())
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
