import { Component, Input, HostBinding, OnInit } from '@angular/core';

@Component({
  selector: 'app-advertisement',
  standalone: true,
  template: `
    <ng-content></ng-content>
  `,
  styleUrls: ['advertisement.component.scss']
})
export class AdvertisementComponent implements OnInit {

  @Input() colors: string[] = [
    '#FF6B6B',
    '#4ECDC4',
    '#556270',
    '#C7F464',
    '#C44D58',
    '#FFA600',
    '#6A4C93'
  ];

  @HostBinding('style.background') background!: string;

  ngOnInit() {
    this.setRandomBackground();
  }

  private setRandomBackground() {
    const index = Math.floor(Math.random() * this.colors.length);
    this.background = this.colors[index];
  }
}
