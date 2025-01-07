import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { YoutubePlayerComponent } from "../../components/youtube-player/youtube-player.component";
import { SearchPage } from './search.page';
import { SearchPageRoutingModule } from './search-routing.module';
import { HttpClient } from '@angular/common/http';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { YoutubeVideoComponent } from 'src/app/components/youtube-video/youtube-video.component';
import { YoutubePlaylistComponent } from 'src/app/components/youtube-playlist/youtube-playlist.component';
import { YoutubeChannelComponent } from 'src/app/components/youtube-channel/youtube-channel.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SearchPageRoutingModule,
    YoutubePlayerComponent,
    YoutubeVideoComponent,
    YoutubePlaylistComponent,
    YoutubeChannelComponent,
    FilterComponent
],
  declarations: [SearchPage]
})
export class SearchPageModule {}
