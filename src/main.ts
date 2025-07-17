import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/components/app/app.component';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular';
import { createHttpClient } from '@actioncrew/streamix/http';
import { InjectionToken } from '@angular/core';
import { routes } from './app/app-routing.module';

export const HTTP_CLIENT = new InjectionToken('HttpClient');
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, RouterModule],
  template: `
  <ion-app>
    <ion-router-outlet></ion-router-outlet>
  </ion-app>
  `
})
export class RootComponent {}

bootstrapApplication(RootComponent, {
  providers: [
    provideRouter(routes),
    IonicModule.forRoot().providers!,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_CLIENT, useFactory: () => createHttpClient() }
  ]
})
  .catch(err => console.error(err));
