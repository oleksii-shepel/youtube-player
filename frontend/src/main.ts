import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular';
import { createHttpClient } from '@actioncrew/streamix/networking';
import { InjectionToken } from '@angular/core';
import { routes } from './app/app-routing.module';

import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { IonicStorageModule } from '@ionic/storage-angular';

export const HTTP_CLIENT = new InjectionToken('HttpClient');

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
    IonicStorageModule.forRoot().providers!,
    IonicModule.forRoot().providers!,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_CLIENT, useFactory: () => createHttpClient() }
  ]
})
  .catch(err => console.error(err));
