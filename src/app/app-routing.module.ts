import { PlaylistPage } from './pages/playlist/playlist.page';
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'search',
    pathMatch: 'full'
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then(m => m.SearchPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
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
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
