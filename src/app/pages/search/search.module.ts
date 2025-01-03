import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { YoutubePlayerComponent } from "../../components/youtube-player/youtube-player.component";
import { SearchPage } from './search.page';
import { SearchPageRoutingModule } from './search-routing.module';
import { HttpClient } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SearchPageRoutingModule,
    YoutubePlayerComponent
],
  declarations: [SearchPage]
})
export class SearchPageModule {}
