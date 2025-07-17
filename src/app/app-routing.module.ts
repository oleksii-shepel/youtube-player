import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./sections/main/main.component').then(m => m.AppComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'app'
      },
      {
        path: 'app',
        loadComponent: () => import('./pages/search/search.page').then(m => m.SearchPage)
      },
      {
        path: 'playlist/:id',
        loadComponent: () => import('./pages/playlist/playlist.page').then(m => m.PlaylistPage)
      },
      {
        path: 'channel/:id',
        loadComponent: () => import('./pages/channel/channel.page').then(m => m.ChannelPage)
      },
      {
        path: 'video/:id',
        loadComponent: () => import('./pages/video/video.page').then(m => m.VideoPage)
      }
    ]
  },
  {
    path: 'settings',
    loadComponent: () => import('./sections/settings/settings.page').then(m => m.SettingsPage)
  }
];

