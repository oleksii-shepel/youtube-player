import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './components/app/app.component';
import { AppRoutingModule } from './app-routing.module';
import { YoutubePlayerComponent } from './components/youtube-player/youtube-player.component';
import { provideHttpClient, withInterceptorsFromDi, withJsonpSupport } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideHttpClient(withInterceptorsFromDi(), withJsonpSupport())],
  bootstrap: [AppComponent],
})
export class AppModule {}
