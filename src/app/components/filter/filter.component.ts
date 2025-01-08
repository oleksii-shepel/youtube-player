import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-filter',
  template: `
    <div class="chip-group-container">
      <!-- Duration Group -->
      <div class="chip-group" *ngIf="searchType === 'videos'">
        <ion-chip [color]="selectedFilters.duration === 'Short' ? 'primary' : 'light'" (click)="selectFilter('duration', 'Short')">
          <ion-label>Short</ion-label>
        </ion-chip>
        <ion-chip [color]="selectedFilters.duration === 'Medium' ? 'primary' : 'light'" (click)="selectFilter('duration', 'Medium')">
          <ion-label>Medium</ion-label>
        </ion-chip>
        <ion-chip [color]="selectedFilters.duration === 'Long' ? 'primary' : 'light'" (click)="selectFilter('duration', 'Long')">
          <ion-label>Long</ion-label>
        </ion-chip>
      </div>

      <!-- HD/SD Group -->
      <div class="chip-group" *ngIf="searchType === 'videos'">
        <ion-chip [color]="selectedFilters.quality === 'HD' ? 'primary' : 'light'" (click)="selectFilter('quality', 'HD')">
          <ion-label>HD</ion-label>
        </ion-chip>
        <ion-chip [color]="selectedFilters.quality === 'SD' ? 'primary' : 'light'" (click)="selectFilter('quality', 'SD')">
          <ion-label>SD</ion-label>
        </ion-chip>
      </div>

      <!-- Live/Upcoming/Archived Group -->
      <div class="chip-group" *ngIf="searchType === 'videos'">
        <ion-chip [color]="selectedFilters.status === 'Live' ? 'primary' : 'light'" (click)="selectFilter('status', 'Live')">
          <ion-label>Live</ion-label>
        </ion-chip>
        <ion-chip [color]="selectedFilters.status === 'Upcoming' ? 'primary' : 'light'" (click)="selectFilter('status', 'Upcoming')">
          <ion-label>Upcoming</ion-label>
        </ion-chip>
        <ion-chip [color]="selectedFilters.status === 'Archived' ? 'primary' : 'light'" (click)="selectFilter('status', 'Archived')">
          <ion-label>Archived</ion-label>
        </ion-chip>
      </div>

      <!-- Playlists Group -->
      <div class="chip-group" *ngIf="searchType === 'playlists'">
        <ion-chip
          *ngFor="let playlist of playlists"
          [color]="selectedFilters.playlist === playlist.value ? 'primary' : 'light'"
          (click)="selectFilter('playlist', playlist.value)"
        >
          <ion-label>{{ playlist.label }}</ion-label>
        </ion-chip>
      </div>

      <!-- Topics Group -->
      <div class="chip-group" *ngIf="searchType === 'channels'">
        <ion-chip
          *ngFor="let topic of topics"
          [color]="selectedFilters.topics.includes(topic.value) ? 'primary' : 'light'"
          (click)="selectFilter('topic', topic.value)"
        >
          <ion-label>{{ topic.label }}</ion-label>
        </ion-chip>
      </div>

    </div>
  `,
  styleUrls: ['./filter.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class FilterComponent {
  resolutions = [
    { label: 'HD', value: 'hd' },
    { label: 'SD', value: 'sd' }
  ];

  liveStatuses = [
    { label: 'Live', value: 'live' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Archived', value: 'archived' }
  ];

  durations = [
    { label: 'Short', value: 'short' },
    { label: 'Medium', value: 'medium' },
    { label: 'Long', value: 'long' }
  ];

  topics = [
    { label: 'Music', value: '/m/04rlf' },
    { label: 'Gaming', value: '/m/0bzvm2' },
    { label: 'Sports', value: '/m/06ntj' },
    { label: 'Education', value: '/m/02jjt' },
    { label: 'News', value: '/m/0k4d' },
    { label: 'Technology', value: '/m/0k4d' },
    { label: 'Movies', value: '/m/01mjl' },
    { label: 'Comedies', value: '/m/02kz58' },
    { label: 'Lifestyle', value: '/m/019_rr' }
  ];

  playlists = [
    { label: 'All', value: 'all' },
    { label: 'Favorites', value: 'favorites' },
    { label: 'Recent', value: 'recent' }
  ];

  selectedResolution: string = '';
  selectedLiveStatus: string = '';
  selectedDuration: string = '';

  selectedFilters = {
    quality: null,
    status: null,
    duration: null,
    topics: [],
    playlist: null
  } as any;

  @Input() searchType: string = 'videos'; // Change to 'channel' or 'video' to test dynamic filters
  @Input() channelFilters: any = [];
  @Input() playlistFilters: any = [];
  @Input() videoFilters: any = [];
  @Output() filtersChanged = new EventEmitter<any>();

  // Select a filter in a group
  selectFilter(category: string, value: string) {
    switch (category) {
      case 'topic':
        if (this.selectedFilters.topics.includes(value)) {
          this.selectedFilters.topics = this.selectedFilters.topics.filter((item: any) => item !== value);
        } else {
          this.selectedFilters.topics.push(value);
        }
        break;

      case 'playlist':
        if(this.selectedFilters.playlist !== value) {
          this.selectedFilters.playlist = value;
        } else {
          this.selectedFilters.playlist = null;
        }
        break;
      case 'duration':
        if(this.selectedFilters.duration !== value) {
          this.selectedFilters.duration = value;
        } else {
          this.selectedFilters.duration = null;
        }
        break;
      case 'quality':
        if(this.selectedFilters.quality !== value) {
          this.selectedFilters.quality = value;
        } else {
          this.selectedFilters.quality = null;
        }
        break;
      case 'status':
        if(this.selectedFilters.status !== value) {
          this.selectedFilters.status = value;
        } else {
          this.selectedFilters.status = null;
        }
        break;
    }
    this.emitFiltersChange();
  }

  // Emit the selected filters to parent component
  emitFiltersChange() {
    this.filtersChanged.emit(this.selectedFilters);
  }

  toggleResolution(value: string) {
    this.selectedResolution = this.selectedResolution === value ? '' : value;
    this.applyFilters();
  }

  toggleLiveStatus(value: string) {
    this.selectedLiveStatus = this.selectedLiveStatus === value ? '' : value;
    this.applyFilters();
  }

  toggleDuration(value: string) {
    this.selectedDuration = this.selectedDuration === value ? '' : value;
    this.applyFilters();
  }

  toggleTopic(topic: string) {
    const index = this.selectedFilters.topics.indexOf(topic);
    if (index === -1) {
      this.selectedFilters.topics.push(topic);
    } else {
      this.selectedFilters.topics.splice(index, 1);
    }
    this.applyFilters();
  }

  isTopicSelected(topic: string): boolean {
    return this.selectedFilters.topics.includes(topic);
  }

  applyFilters() {
    console.log({
      resolution: this.selectedResolution,
      liveStatus: this.selectedLiveStatus,
      duration: this.selectedDuration,
      topics: this.selectedFilters.topics
    });
  }
}
