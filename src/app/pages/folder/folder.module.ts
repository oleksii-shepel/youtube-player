import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FolderPageRoutingModule } from './folder-routing.module';

import { FolderPage } from './folder.page';
import { YoutubePlayerComponent } from "../../components/youtube-player/youtube-player.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FolderPageRoutingModule,
    YoutubePlayerComponent
],
  declarations: [FolderPage]
})
export class FolderPageModule {}
