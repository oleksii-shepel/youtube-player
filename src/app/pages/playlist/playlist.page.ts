import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StreamixModule } from 'projects/angular/src/lib';
import { DirectiveModule } from 'src/app/directives';

@Component({
  selector: 'app-search',
  template: `
    <div>this works!</div>
  `,
  styleUrls: ['./playlist.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DirectiveModule,
    StreamixModule
  ]
})
export class PlaylistPage {

}
