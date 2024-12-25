import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  standalone: false,
})
export class FolderPage implements OnInit {
  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);
  player!: YT.Player;
  id: string = "qDuKsiwS5xw";

  constructor() {}

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
  }

  savePlayer(player: YT.Player) {
    this.player = player;
    console.log("player instance", player);
  }
  onStateChange(event: YT.PlayerEvent) {
    console.log("player state", event);
  }
}
