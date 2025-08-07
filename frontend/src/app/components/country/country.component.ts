import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import * as countries from 'i18n-iso-countries';
import englishCountries from 'i18n-iso-countries/langs/en.json';
import { DirectiveModule } from 'src/app/directives';
import countryLanguages from './country-languages.json';
import ISO6391 from 'iso-639-1';

// Extended interfaces
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface Country {
  code: string;
  name: string;
  nativeName: string;
  languages: Language[];
}

export interface CountryLanguageSelection {
  country: Country;
  language: Language;
}

@Component({
  selector: 'app-country-select-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, DirectiveModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="modal-backdrop"
      [class.hidden]="!isOpen"
      (click)="onClose()"
    ></div>
    <div
      class="modal-container"
      [class.hidden]="!isOpen"
      [class.with-border]="showBorder"
      (click)="$event.stopPropagation()"
    >
      <!-- Header -->
      <div class="modal-header">
        <ion-toolbar>
          <ion-title>
            {{ selectedCountry && !showLanguageStep ? 'Select Language' : 'Select Country' }}
          </ion-title>
          <ion-buttons slot="end">
            @if (selectedCountry && !showLanguageStep) {
              <ion-button (click)="backToCountrySelection()">
                <ion-icon name="arrow-back"></ion-icon>
              </ion-button>
            }
            <ion-button (click)="onClose()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>

        <!-- Progress indicator -->
        <div class="progress-indicator">
          <div class="step" [class.active]="showLanguageStep || !selectedCountry" [class.completed]="selectedCountry && !showLanguageStep">
            <div class="step-number">1</div>
            <span>Country</span>
          </div>
          <div class="step-connector" [class.active]="selectedCountry"></div>
          <div class="step" [class.active]="selectedCountry && !showLanguageStep" [class.completed]="selectedLanguage">
            <div class="step-number">2</div>
            <span>Language</span>
          </div>
        </div>

        <!-- Auto-detection option -->
        @if (showLanguageStep || !selectedCountry) {
          <div class="auto-detection-section">
            <ion-item
              lines="none"
              class="auto-detection-item"
              button
              (click)="toggleAutoDetection()"
            >
              <ion-checkbox
                slot="start"
                [(ngModel)]="enableAutoDetection"
                (ionChange)="onAutoDetectionToggle()"
                [disabled]="isDetectingLocation"
                (click)="$event.stopPropagation()"
              ></ion-checkbox>

              <ion-label>
                <h3>Auto-detect my country</h3>
                <p class="subdued">Use your location to automatically select your country</p>
              </ion-label>

              @if (isDetectingLocation) {
                <ion-spinner name="crescent" slot="end"></ion-spinner>
              }
              @if (geolocationError) {
                <ion-icon name="alert-circle" slot="end" color="warning"></ion-icon>
              }
            </ion-item>

            @if (geolocationError) {
              <div class="error-message ion-padding-start">
                <ion-icon name="information-circle" color="warning"></ion-icon>
                <span class="warning-text">{{ geolocationError }}</span>
              </div>
            }
          </div>
        }


        @if (showLanguageStep && !enableAutoDetection) {
          <ion-toolbar>
            <div class="searchbar-wrapper">
              <div class="search-container">
                <ion-icon name="search-outline"></ion-icon>
                <ion-input
                  [(ngModel)]="searchTerm"
                  (ionInput)="filterItems()"
                  debounce="300"
                  placeholder="Search country..."
                  type="search"
                  autocomplete="off"
                  autocorrect="off"
                  spellcheck="false"
                ></ion-input>
                <ion-button fill="clear" size="small" (click)="clearSearch()" *ngIf="searchTerm">
                  <ion-icon name="close-circle"></ion-icon>
                </ion-button>
              </div>
            </div>
          </ion-toolbar>
        }
      </div>

      <!-- Content -->
      <div class="modal-content scrollable">
        @if (isLoading) {
          <div class="status-message">
            <ion-spinner name="crescent"></ion-spinner>
            Loading {{ selectedCountry && !showLanguageStep ? 'languages' : 'countries' }}...
          </div>
        } @else {
          <!-- Country Selection Step -->
          @if (showLanguageStep || !selectedCountry) {
            @if (enableAutoDetection && detectedCountry) {
              <div class="detected-country-section">
                <div class="detected-country-header">
                  <ion-icon name="location" color="primary"></ion-icon>
                  <h4>Detected Country</h4>
                </div>
                <ion-item
                  button
                  (click)="selectCountry(detectedCountry)"
                  [class.selected]="tempSelectedCountry?.code === detectedCountry.code"
                  class="detected-country-item"
                >
                  <ion-label>
                    <h3>{{ detectedCountry.name }}</h3>
                    <p>{{ detectedCountry.nativeName }}</p>
                    <p class="country-code">{{ detectedCountry.code }}</p>
                    <p class="language-count">{{ detectedCountry.languages.length }} language(s)</p>
                  </ion-label>
                  @if (tempSelectedCountry?.code === detectedCountry.code) {
                    <ion-icon
                      name="checkmark-circle"
                      slot="end"
                      color="primary"
                    ></ion-icon>
                  }
                </ion-item>
                <div class="manual-selection-divider">
                  <span>or choose manually</span>
                </div>
              </div>
            }

            @if (!enableAutoDetection || (enableAutoDetection && detectedCountry)) {
              @if (filteredCountries.length === 0 && searchTerm) {
                <div class="overlay">
                  <ion-icon name="search-outline" size="large"></ion-icon>
                  <p>No countries found</p>
                  <p>Try adjusting your search terms</p>
                </div>
              } @else {
                <ion-list>
                  @for (country of filteredCountries; track country.code) {
                    <ion-item
                      button
                      (click)="selectCountry(country)"
                      [class.selected]="tempSelectedCountry?.code === country.code"
                      [class.detected]="detectedCountry && country.code === detectedCountry.code"
                    >
                      <ion-label>
                        <h3>{{ country.name }}</h3>
                        <p>{{ country.nativeName }}</p>
                        <p class="country-code">{{ country.code }}</p>
                        <p class="language-count">{{ country.languages.length }} language(s)</p>
                      </ion-label>
                      @if (tempSelectedCountry?.code === country.code) {
                        <ion-icon
                          name="checkmark-circle"
                          slot="end"
                          color="primary"
                        ></ion-icon>
                      }
                      @if (detectedCountry && country.code === detectedCountry.code && tempSelectedCountry?.code !== country.code) {
                        <ion-icon
                          name="location"
                          slot="end"
                          color="medium"
                        ></ion-icon>
                      }
                    </ion-item>
                  }
                </ion-list>
                @if (searchTerm && filteredCountries.length > 0) {
                  <div class="status-message">
                    {{ filteredCountries.length }} of {{ allCountries.length }} countries
                  </div>
                }
              }
            }
          }

          <!-- Language Selection Step -->
          @if (selectedCountry && !showLanguageStep) {
            <div class="selected-country-info">
              <h4>{{ selectedCountry.name }}</h4>
              <p>Select a language spoken in this country:</p>
            </div>

            <ion-list>
              @for (language of filteredLanguages; track language.code) {
                <ion-item
                  button
                  (click)="selectLanguage(language)"
                  [class.selected]="selectedLanguage?.code === language.code"
                >
                  <ion-label>
                    <h3>{{ language.name }}</h3>
                    <p class="language-code">{{ language.code }}</p>
                  </ion-label>
                  @if (selectedLanguage?.code === language.code) {
                    <ion-icon
                      name="checkmark-circle"
                      slot="end"
                      color="primary"
                    ></ion-icon>
                  }
                </ion-item>
              }
            </ion-list>
          }
        }
      </div>

      <!-- Controls -->
      <div class="controls">
        @if (selectedCountry && !showLanguageStep) {
          <!-- Language step controls -->
          <ion-button
            (click)="onCountryLanguageSelect()"
            fill="solid"
            color="primary"
            size="small"
            [disabled]="!selectedLanguage"
          >
            <ion-icon name="checkmark" slot="start"></ion-icon>
            Select {{ selectedLanguage?.name ?? 'Language' }}
          </ion-button>
        } @else {
          <!-- Country step controls -->
          <ion-button
            (click)="proceedToLanguageSelection()"
            fill="solid"
            color="primary"
            size="small"
            [disabled]="!tempSelectedCountry"
          >
            <ion-icon name="arrow-forward" slot="start"></ion-icon>
            Next: Select Language
          </ion-button>
        }

        <ion-button
          (click)="onClose()"
          fill="clear"
          color="primary"
          size="small"
          class="close-btn"
        >
          <ion-icon name="close" slot="start"></ion-icon>
          Cancel
        </ion-button>
      </div>
    </div>
  `,
  styleUrls: ['country.component.scss'],
})
export class CountrySelectModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() showBorder = true;
  @Input() selectedCountry: Country | null = null;
  @Input() selectedLanguage: Language | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() select = new EventEmitter<CountryLanguageSelection>();

  allCountries: Country[] = [];
  filteredCountries: Country[] = [];
  filteredLanguages: Language[] = [];
  tempSelectedCountry: Country | null = null;
  searchTerm = '';
  isLoading = true;
  showLanguageStep = true; // Start with country selection

  // Geolocation properties
  enableAutoDetection = false;
  isDetectingLocation = false;
  detectedCountry: Country | null = null;
  geolocationError: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef
  ) {
    countries.registerLocale(englishCountries);
  }

  async ngOnInit() {
    await this.loadCountries();
  }

  async loadCountries() {
    this.isLoading = true;
    try {
      const countryCodes = countries.getAlpha2Codes();
      this.allCountries = Object.entries(countryCodes)
        .map(([code, name]) => {
          const languageCodes = (countryLanguages as any)[code] || [];
          const languages: Language[] = languageCodes.map((langCode: string) => ({
            code: langCode,
            name: ISO6391.getName(langCode) || langCode.toUpperCase(),
            nativeName: ISO6391.getNativeName(langCode) || ISO6391.getName(langCode) || langCode.toUpperCase()
          }));

          return {
            code,
            name: name as string,
            nativeName: countries.getName(code, 'en') || (name as string),
            languages
          };
        })
        .filter(c => c.name && c.nativeName && c.languages.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

      this.filteredCountries = [...this.allCountries];

      // Set initial state based on existing selection
      if (this.selectedCountry) {
        this.tempSelectedCountry = this.selectedCountry;
        this.showLanguageStep = false;
        this.filteredLanguages = [...this.selectedCountry.languages];
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  toggleAutoDetection() {
    if (!this.isDetectingLocation) {
      this.enableAutoDetection = !this.enableAutoDetection;
      this.onAutoDetectionToggle();
    }
  }

  async onAutoDetectionToggle() {
    if (this.enableAutoDetection) {
      await this.detectCountryByLocation();
    } else {
      this.clearGeolocationData();
    }
  }

  async detectCountryByLocation() {
    this.isDetectingLocation = true;
    this.geolocationError = null;
    this.detectedCountry = null;
    this.cdr.markForCheck();

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await this.getCurrentPosition();
      const countryCode = await this.getCountryFromCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );

      if (countryCode) {
        this.detectedCountry = this.allCountries.find(c => c.code === countryCode) || null;

        if (this.detectedCountry) {
          // Auto-select the detected country
          this.tempSelectedCountry = this.detectedCountry;
        } else {
          this.geolocationError = 'Could not find country information';
        }
      } else {
        this.geolocationError = 'Could not determine country from location';
      }
    } catch (error) {
      this.geolocationError = this.getGeolocationErrorMessage(error);
    } finally {
      this.isDetectingLocation = false;
      this.cdr.markForCheck();
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  private async getCountryFromCoordinates(lat: number, lng: number): Promise<string | null> {
    try {
      // Using a free geocoding service (you might want to use a different one)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      return data.countryCode || null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  private getGeolocationErrorMessage(error: any): string {
    if (error.code) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return 'Location access denied. Please enable location services.';
        case error.POSITION_UNAVAILABLE:
          return 'Location information unavailable.';
        case error.TIMEOUT:
          return 'Location request timed out. Please try again.';
        default:
          return 'An unknown error occurred while detecting location.';
      }
    }
    return error.message || 'Failed to detect location.';
  }

  private clearGeolocationData() {
    this.detectedCountry = null;
    this.geolocationError = null;
    this.isDetectingLocation = false;
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterItems();
  }

  filterItems() {
    if (this.selectedCountry && !this.showLanguageStep) {
      this.filterLanguages();
    } else {
      this.filterCountries();
    }
  }

  filterCountries() {
    if (!this.searchTerm) {
      this.filteredCountries = [...this.allCountries];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCountries = this.allCountries.filter(
        c =>
          c.name.toLowerCase().includes(term) ||
          c.nativeName.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term)
      );
    }
  }

  filterLanguages() {
    if (!this.selectedCountry) return;

    if (!this.searchTerm) {
      this.filteredLanguages = [...this.selectedCountry.languages];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredLanguages = this.selectedCountry.languages.filter(
        l =>
          l.name.toLowerCase().includes(term) ||
          l.code.toLowerCase().includes(term)
      );
    }
  }

  selectCountry(country: Country) {
    this.tempSelectedCountry = country;
  }

  selectLanguage(language: Language) {
    this.selectedLanguage = language;
  }

  proceedToLanguageSelection() {
    if (!this.tempSelectedCountry) return;

    this.selectedCountry = this.tempSelectedCountry;
    this.showLanguageStep = false;
    this.searchTerm = '';
    this.filteredLanguages = [...this.selectedCountry.languages];
  }

  backToCountrySelection() {
    this.showLanguageStep = true;
    this.selectedCountry = null;
    this.selectedLanguage = null;
    this.searchTerm = '';
    this.filteredCountries = [...this.allCountries];
  }

  onClose() {
    this.close.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  onCountryLanguageSelect() {
    if (this.selectedCountry && this.selectedLanguage) {
      this.select.emit({
        country: this.selectedCountry,
        language: this.selectedLanguage
      });
    }
  }
}
