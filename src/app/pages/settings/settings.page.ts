import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  template: `
     <ion-header>
      <div class="scrollable">
        <div class="toolbar-inner">
          <div class="toolbar">
            <div class="toolbar-left">
              <ion-title>YouTube Settings</ion-title>
            </div>
          </div>
        </div>
      </div>
    </ion-header>

    <ion-content>
        <form [formGroup]="searchForm" (ngSubmit)="onSubmit()" class="ion-padding">
          <ion-grid>
            <ion-row>
              <ion-col size="12" size-md="6">
                <ion-item>
                  <ion-label>Region</ion-label>
                  <ion-select formControlName="region" placeholder="Select">
                    <ion-select-option value="">Any</ion-select-option>
                    <ion-select-option value="US">US</ion-select-option>
                    <ion-select-option value="UK">UK</ion-select-option>
                    <ion-select-option value="CA">Canada</ion-select-option>
                    <ion-select-option value="UA">Ukraine</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>

              <ion-col size="12" size-md="6">
                <ion-item>
                  <ion-label>Language</ion-label>
                  <ion-select formControlName="language" placeholder="Select">
                    <ion-select-option value="">Any</ion-select-option>
                    <ion-select-option value="en">English</ion-select-option>
                    <ion-select-option value="es">Spanish</ion-select-option>
                    <ion-select-option value="fr">French</ion-select-option>
                    <ion-select-option value="de">German</ion-select-option>
                    <ion-select-option value="ru">Russian</ion-select-option>
                    <ion-select-option value="ua">Ukrainian</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>

              <ion-col size="12" size-md="6">
                <ion-item>
                  <ion-label>Video Duration</ion-label>
                  <ion-select formControlName="duration" placeholder="Select">
                    <ion-select-option value="">Any</ion-select-option>
                    <ion-select-option value="short">Short (&lt; 4 mins)</ion-select-option>
                    <ion-select-option value="medium">Medium (4-20 mins)</ion-select-option>
                    <ion-select-option value="long">Long (&gt; 20 mins)</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>

              <ion-col size="12" size-md="6">
                <ion-item>
                  <ion-label>Upload Date</ion-label>
                  <ion-select formControlName="uploadDate" placeholder="Select">
                    <ion-select-option value="">Any</ion-select-option>
                    <ion-select-option value="pastHour">Past Hour</ion-select-option>
                    <ion-select-option value="today">Today</ion-select-option>
                    <ion-select-option value="thisWeek">This Week</ion-select-option>
                    <ion-select-option value="thisMonth">This Month</ion-select-option>
                    <ion-select-option value="thisYear">This Year</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>

              <ion-col size="12" size-md="6">
                <ion-item>
                  <ion-label>Sort By</ion-label>
                  <ion-select formControlName="sortBy">
                    <ion-select-option value="relevance">Relevance</ion-select-option>
                    <ion-select-option value="uploadDate">Upload Date</ion-select-option>
                    <ion-select-option value="viewCount">View Count</ion-select-option>
                    <ion-select-option value="rating">Rating</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>

              <ion-col size="12" size-md="6">
                <ion-item>
                  <ion-label>SafeSearch</ion-label>
                  <ion-select formControlName="safeSearch">
                    <ion-select-option value="all">All</ion-select-option>
                    <ion-select-option value="moderate">Moderate</ion-select-option>
                    <ion-select-option value="strict">Strict</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>
            </ion-row>

            <ion-row class="ion-padding-top">
              <ion-col size="6">
                <ion-button expand="block" color="primary" type="submit">Apply</ion-button>
              </ion-col>
              <ion-col size="6">
                <ion-button expand="block" color="medium" type="button" (click)="reset()">Reset</ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </form>
      </ion-content>
  `,
  styleUrls: ['./settings.page.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class SettingsPage {
  @Input() settings: any = {};
  @Output() filterApplied = new EventEmitter<any>();

  searchForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      region: [''],
      language: [''],
      duration: [''],
      uploadDate: [''],
      sortBy: ['relevance'],
      safeSearch: ['all'],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings']?.currentValue) {
      this.searchForm.patchValue(this.settings);
    }
  }

  onSubmit() {
    this.filterApplied.emit(this.searchForm.value);
  }

  reset() {
    this.searchForm.reset({
      region: '',
      language: '',
      duration: '',
      uploadDate: '',
      sortBy: 'relevance',
      safeSearch: 'all',
    });
  }
}
