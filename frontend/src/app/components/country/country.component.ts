// country-select-modal.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import * as countries from 'i18n-iso-countries';
import englishCountries from 'i18n-iso-countries/langs/en.json';


interface Country {
  code: string;
  name: string;
  nativeName: string;
}

@Component({
  selector: 'app-country-select-modal',
  template: `
        <ion-header>
      <ion-toolbar>
        <ion-title>Select Country</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Search countries..."
          [(ngModel)]="searchTerm"
          (ionInput)="filterCountries($event)"
          debounce="300"
          show-clear-button="focus"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <div class="scrollable">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading countries...</p>
      </div>

      <!-- Country List -->
      <div *ngIf="!isLoading">
        <ion-list>
          <ion-item
            *ngFor="let country of filteredCountries; let i = index"
            button
            (click)="selectCountry(country)"
            [class.selected]="selectedCountry?.code === country.code"
          >
            <ion-label>
              <h3>{{ country.name }}</h3>
              <p>{{ country.nativeName }}</p>
              <p class="country-code">{{ country.code }}</p>
            </ion-label>

            <ion-icon
              *ngIf="selectedCountry?.code === country.code"
              name="checkmark-circle"
              slot="end"
              color="primary"
            ></ion-icon>
          </ion-item>
        </ion-list>

        <!-- Empty State -->
        <div
          *ngIf="filteredCountries.length === 0 && searchTerm && !isLoading"
          class="empty-state"
        >
          <ion-icon name="search-outline"></ion-icon>
          <p>No countries found</p>
          <p class="empty-subtext">Try adjusting your search terms</p>
        </div>

        <!-- Results Counter -->
        <div
          class="results-info"
          *ngIf="searchTerm && filteredCountries.length > 0"
        >
          <small
            >{{ filteredCountries.length }} of
            {{ allCountries.length }} countries</small
          >
        </div>
      </div>
    </div>

    <ion-footer *ngIf="selectedCountry">
      <ion-toolbar>
        <ion-button expand="block" fill="solid" (click)="confirmSelection()">
          Select {{ selectedCountry.name }}
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: var(--ion-color-medium);
      }

      .loading-container ion-spinner {
        margin-bottom: 16px;
      }

      .selected {
        --background: var(--ion-color-primary-tint);
        --color: var(--ion-color-primary-shade);
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: var(--ion-color-medium);
      }

      .empty-state ion-icon {
        font-size: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .empty-subtext {
        font-size: 0.875rem;
        margin-top: 8px;
        opacity: 0.7;
      }

      .results-info {
        text-align: center;
        padding: 8px;
        color: var(--ion-color-medium);
        border-top: 1px solid var(--ion-border-color);
        background: var(--ion-color-light);
      }

      ion-item h3 {
        margin: 0 0 4px 0;
        font-weight: 600;
        color: var(--ion-text-color);
      }

      ion-item p {
        margin: 2px 0;
        font-size: 0.875rem;
        color: var(--ion-color-medium);
      }

      .country-code {
        font-family: 'Courier New', monospace;
        font-size: 0.75rem !important;
        text-transform: uppercase;
        background: var(--ion-color-light);
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        margin-top: 4px;
      }

      ion-footer ion-button {
        margin: 8px;
      }
    `,
  ],
  imports: [CommonModule, IonicModule, FormsModule],
})
export class CountrySelectModalComponent implements OnInit {
  @Input() selectedCountry: Country | null = null;

  allCountries: Country[] = [];
  filteredCountries: Country[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;

  constructor(private modalController: ModalController) {
    // Register the English language for country names
    countries.registerLocale(englishCountries);
  }

  async ngOnInit() {
    await this.loadCountries();
  }

  async loadCountries() {
    try {
      this.isLoading = true;

      // Simulate async loading (you can remove timeout if not needed)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Load all countries from i18n-iso-countries
      const countryCodes = countries.getAlpha2Codes();

      this.allCountries = Object.entries(countryCodes)
        .map(([code, name]) => ({
          code,
          name: name as string,
          nativeName: countries.getName(code, 'en') || (name as string)
        }))
        .filter(country => country.name && country.nativeName) // Filter out any invalid entries
        .sort((a, b) => a.name.localeCompare(b.name));

      this.filteredCountries = [...this.allCountries];
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading countries:', error);
      this.isLoading = false;
      // You could show an error toast here
    }
  }

  filterCountries(event: any) {
    const searchTerm = event.target.value?.toLowerCase() || '';
    this.searchTerm = searchTerm;

    if (!searchTerm) {
      this.filteredCountries = [...this.allCountries];
      return;
    }

    this.filteredCountries = this.allCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm) ||
        country.nativeName.toLowerCase().includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm)
    );
  }

  selectCountry(country: Country) {
    this.selectedCountry = country;
  }

  confirmSelection() {
    if (this.selectedCountry) {
      this.modalController.dismiss(this.selectedCountry);
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
