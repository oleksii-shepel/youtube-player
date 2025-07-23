import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  template: `
    <!-- Custom Header Div -->
    <div class="modal-header">
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
          (ionInput)="filterCountries()"
          debounce="300"
          show-clear-button="focus"
        ></ion-searchbar>
      </ion-toolbar>
    </div>

    <!-- Custom Content Div -->
    <div class="modal-content scrollable">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading countries...</p>
      </div>

      <!-- Country List -->
      <ion-list *ngIf="!isLoading">
        <ion-item
          *ngFor="let country of filteredCountries"
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
        <small>{{ filteredCountries.length }} of {{ allCountries.length }} countries</small>
      </div>
    </div>

    <!-- Custom Footer Div -->
    <div class="modal-footer">
      <ion-toolbar>
        <ion-button expand="block" fill="solid" (click)="confirmSelection()">
          Select {{ selectedCountry?.name ?? '' }}
        </ion-button>
      </ion-toolbar>
    </div>
  `,
  styles: [`
    /* Host styles to control the modal's overall layout */
    :host {
      display: flex;
      flex-direction: column;
      max-height: var(--modal-height, 80vh); /* Fallback to 80vh */
      height: auto; /* Allow shrinking to content */
      overflow: hidden; /* Prevent host scrollbar */
      user-select: none;
    }

    /* Styles for the custom header div */
    .modal-header {
      flex-shrink: 0;
      background: var(--ion-background-color, #fff);
      box-shadow: var(--ion-box-shadow-xs);
      z-index: 10;
    }

    /* Styles for the custom content div */
    .modal-content {
      flex-grow: 1;
      flex-shrink: 1;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--ion-background-color, #fff);
      -webkit-overflow-scrolling: touch;
      /* Dynamic height based on modal height minus header and footer */
      max-height: calc(var(--modal-height, 80vh) - var(--header-height, 112px) - var(--footer-height, 64px));
      min-height: 100px; /* Prevent collapsing too much */
    }

    /* Styles for the custom footer div */
    .modal-footer {
      flex-shrink: 0;
      background: var(--ion-background-color, #fff);
      box-shadow: var(--ion-box-shadow-xs);
      z-index: 10;
      padding-bottom: env(safe-area-inset-bottom);
    }

    .modal-footer ion-toolbar {
      --padding-start: 0;
      --padding-end: 0;
      --padding-top: 0;
      --padding-bottom: 0;
    }

    .modal-footer ion-button {
      margin: 8px 16px;
    }

    /* Generic styles for content */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: var(--ion-color-medium);
      min-height: 80px;
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
      padding: 40px 20px;
      color: var(--ion-color-medium);
      min-height: 80px;
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
      flex-shrink: 0;
    }
    ion-list {
      width: 100%;
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

    /* Hide scrollbars */
    .modal-content.no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .modal-content.no-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class CountrySelectModalComponent {
  @Input() isOpen = false;
  @Input() selectedCountry: Country | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() countrySelected = new EventEmitter<Country>();

  allCountries: Country[] = [];
  filteredCountries: Country[] = [];
  searchTerm = '';
  isLoading = true;

  constructor(private modalController: ModalController) {
    countries.registerLocale(englishCountries);
    this.loadCountries();
  }

  async loadCountries() {
    try {
      this.isLoading = true;
      await new Promise(resolve => setTimeout(resolve, 300));
      const countryCodes = countries.getAlpha2Codes();
      this.allCountries = Object.entries(countryCodes)
        .map(([code, name]) => ({
          code,
          name: name as string,
          nativeName: countries.getName(code, 'en') || (name as string)
        }))
        .filter(country => country.name && country.nativeName)
        .sort((a, b) => a.name.localeCompare(b.name));
      console.log('Loaded countries:', this.allCountries.length);
      this.filteredCountries = [...this.allCountries];
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      this.isLoading = false;
      this.updateModalHeight();
    }
  }

  filterCountries() {
    if (!this.searchTerm) {
      this.filteredCountries = [...this.allCountries];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCountries = this.allCountries.filter(
        country => country.name.toLowerCase().includes(term) ||
                  country.nativeName.toLowerCase().includes(term) ||
                  country.code.toLowerCase().includes(term)
      );
    }
    console.log('Filtered countries:', this.filteredCountries.length);
    // Update height after filtering
    this.updateModalHeight();
  }

  selectCountry(country: Country) {
    this.selectedCountry = country;
  }

  confirmSelection() {
    if (this.selectedCountry) {
      this.countrySelected.emit(this.selectedCountry);
      this.isOpenChange.emit(false);
      this.modalController.dismiss();
    }
  }

  dismiss() {
    this.isOpenChange.emit(false);
    this.modalController.dismiss();
  }

  async updateModalHeight() {
    const modal = await this.modalController.getTop();
    if (modal) {
      modal.onDidDismiss().then(() => {});
      modal.onWillDismiss().then(() => {});
      modal.addEventListener('ionBreakpointDidChange', (event: any) => {
        const breakpoint = event.detail.breakpoint;
        const modalHeight = `${breakpoint * 100}vh`;
        document.documentElement.style.setProperty('--modal-height', modalHeight);
      });
      // Set initial height
      const currentBreakpoint = await modal.getCurrentBreakpoint() || 0.5;
      const modalHeight = `${currentBreakpoint * 100}vh`;
      document.documentElement.style.setProperty('--modal-height', modalHeight);
    }
  }
}
