import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import * as countries from 'i18n-iso-countries';
import englishCountries from 'i18n-iso-countries/langs/en.json';
import { DirectiveModule } from 'src/app/directives';
import countryLanguages from './country-languages.json';
import ISO6391 from 'iso-639-1';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SheetConfig, SheetDirective } from 'src/app/directives/sheet/sheet.directive';
import { createSubject } from '@actioncrew/streamix';

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
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DirectiveModule,
    ScrollingModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [appSheet]="appSheet" #sheetDirective="appSheetDirective">
      <div class="modal-backdrop" (click)="onClose()"></div>
      <div class="modal-container" [class.with-border]="showBorder" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <ion-toolbar>
            <ion-title>
              {{ showLanguageStep ? 'Select Country' : 'Select Language' }}
            </ion-title>
            <ion-buttons slot="end">
              @if (!showLanguageStep) {
              <ion-button (click)="backToCountrySelection()">
                <ion-icon name="arrow-back"></ion-icon>
              </ion-button>
              }
              <ion-button (click)="onClose()">
                <ion-icon name="close"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>

          <div class="progress-indicator">
            <div
              class="step"
              [class.active]="showLanguageStep"
              [class.completed]="tempSelectedCountry"
            >
              <div class="step-number">1</div>
              <span>{{ tempSelectedCountry?.nativeName || 'Country' }}</span>
            </div>
            <div class="step-connector" [class.active]="tempSelectedCountry"></div>
            <div
              class="step"
              [class.active]="!showLanguageStep"
              [class.completed]="tempSelectedLanguage"
            >
              <div class="step-number">2</div>
              <span>{{ tempSelectedLanguage?.name || 'Language' }}</span>
            </div>
          </div>

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
                  <ion-button
                    fill="clear"
                    size="small"
                    (click)="clearSearch()"
                    *ngIf="searchTerm"
                  >
                    <ion-icon name="close-circle"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </ion-toolbar>
          }
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

        <div class="modal-content scrollable">
          @if (isLoading) {
            <div class="status-message">
              <ion-spinner name="crescent"></ion-spinner>
              Loading {{ showLanguageStep ? 'countries' : 'languages' }}...
            </div>
          } @else {
            @if (showLanguageStep) {
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
                      <ion-icon name="checkmark-circle" slot="end" color="primary"></ion-icon>
                    }
                  </ion-item>

                  <div class="manual-selection-divider">
                    <span>or choose manually</span>
                  </div>
                </div>
              }

              @if (!enableAutoDetection || detectedCountry) {
                @if (filteredCountries.length === 0 && searchTerm) {
                  <div class="overlay">
                    <ion-icon name="search-outline" size="large"></ion-icon>
                    <p>No countries found</p>
                    <p>Try adjusting your search terms</p>
                  </div>
                } @else {
                  <div virtualScroll [virtualScrollItemTemplate]="countryItemTemplate" [virtualScrollOf]="filteredCountries" class="viewport country-list"></div>

                  @if (searchTerm && filteredCountries.length > 0) {
                    <div class="status-message">
                      {{ filteredCountries.length }} of {{ allCountries.length }} countries
                    </div>
                  }
                }
              }
            }

            @if (!showLanguageStep) {
              <div class="selected-country-info">
                <h4>{{ selectedCountry?.name }}</h4>
                <p>Select a language spoken in this country:</p>
              </div>

              <div virtualScroll [virtualScrollItemTemplate]="languageItemTemplate" [virtualScrollOf]="filteredLanguages" class="viewport language-list"></div>
            }
          }
        </div>

        <ng-template
          #countryItemTemplate
          let-country
          let-index="index"
          let-top="top"
        >
          <ion-item
            button
            (click)="selectCountry(country)"
            [class.selected]="tempSelectedCountry?.code === country.code"
            [class.detected]="detectedCountry?.code === country.code"
          >
            <ion-label>
              <h3>{{ country.name }}</h3>
              <p>{{ country.nativeName }}</p>
              <p class="country-code">{{ country.code }}</p>
              <p class="language-count">
                {{ country.languages.length }} language(s)
              </p>
            </ion-label>

            @if (tempSelectedCountry?.code === country.code) {
            <ion-icon
              name="checkmark-circle"
              slot="end"
              color="primary"
            ></ion-icon>
            } @if (detectedCountry?.code === country.code &&
            tempSelectedCountry?.code !== country.code) {
            <ion-icon name="location" slot="end" color="medium"></ion-icon>
            }
          </ion-item>
        </ng-template>

        <ng-template
          #languageItemTemplate
          let-language
          let-index="index"
          let-top="top"
        >
          <ion-item
            button
            (click)="selectLanguage(language)"
            [class.selected]="tempSelectedLanguage?.code === language.code"
          >
            <ion-label>
              <h3>{{ language.name }}</h3>
              <p class="language-code">{{ language.code }}</p>
            </ion-label>

            @if (tempSelectedLanguage?.code === language.code) {
            <ion-icon
              name="checkmark-circle"
              slot="end"
              color="primary"
            ></ion-icon>
            }
          </ion-item>
        </ng-template>

        <div class="controls">
          @if (!showLanguageStep) {
            <ion-button
              (click)="onCountryLanguageSelect()"
              fill="solid"
              color="primary"
              size="small"
              [disabled]="!tempSelectedLanguage"
            >
              <ion-icon name="checkmark" slot="start"></ion-icon>
              Select {{ tempSelectedLanguage?.name ?? 'Language' }}
            </ion-button>
          } @else {
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
    </div>
  `,
  styleUrls: ['country.component.scss'],
})
export class CountrySelectModalComponent implements OnInit {
  public sheetDirectiveInstance!: SheetDirective;

  @ViewChild('sheetDirective') set sheetDirective(directive: SheetDirective) {
    if (directive) {
      this.sheetDirectiveInstance = directive;
      this.directiveReady.emit(directive);
      this.sheetDirectiveInstance.didDismiss.subscribe(() => {
        this.didDismiss.next(null);
        this.didDismiss.complete();
      });
    }
  }
  @Input() appSheet: SheetConfig = {
    breakpoints: [
      { id: 'small', height: 90 },
      { id: 'medium', height: 90 },
      { id: 'full', height: 90 }
    ],
    initialBreakpoint: 'full',
    backdropDismiss: true,
    showBackdrop: true,
    canDismiss: true
  };

  @Input() showBorder = true;
  @Input() selectedCountry: Country | null = null;
  @Input() selectedLanguage: Language | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() select = new EventEmitter<CountryLanguageSelection>();
  @Output() directiveReady = new EventEmitter<SheetDirective>();
  public didDismiss = createSubject<any>();

  allCountries: Country[] = [];
  filteredCountries: Country[] = [];
  filteredLanguages: Language[] = [];
  tempSelectedCountry: Country | null = null;
  tempSelectedLanguage: Language | null = null;
  searchTerm = '';
  isLoading = true;
  showLanguageStep = true; // Always start at the country selection step

  enableAutoDetection = false;
  isDetectingLocation = false;
  detectedCountry: Country | null = null;
  geolocationError: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    countries.registerLocale(englishCountries);
  }

  async ngOnInit() {
    await this.loadCountries();

    // Set initial temporary selections from inputs
    this.tempSelectedCountry = this.selectedCountry;
    this.tempSelectedLanguage = this.selectedLanguage;

    // Always start at the country selection step, regardless of initial input.
    this.showLanguageStep = true;

    this.cdr.markForCheck();
  }

  trackByCode(index: number, item: { code: string }): string {
    return item.code;
  }

  async loadCountries() {
    this.isLoading = true;
    try {
      const countryCodes = countries.getAlpha2Codes();
      this.allCountries = Object.entries(countryCodes)
        .map(([code, name]) => {
          const languageCodes = (countryLanguages as any)[code] || [];
          const languages: Language[] = languageCodes.map(
            (langCode: string) => ({
              code: langCode,
              name: ISO6391.getName(langCode) || langCode.toUpperCase(),
              nativeName:
                ISO6391.getNativeName(langCode) ||
                ISO6391.getName(langCode) ||
                langCode.toUpperCase(),
            })
          );

          return {
            code,
            name: name as string,
            nativeName: countries.getName(code, 'en') || (name as string),
            languages,
          };
        })
        .filter((c) => c.name && c.nativeName && c.languages.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

      this.filteredCountries = [...this.allCountries];
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
        this.detectedCountry =
          this.allCountries.find((c) => c.code === countryCode) || null;

        if (this.detectedCountry) {
          this.tempSelectedCountry = this.detectedCountry;
          if(this.tempSelectedCountry !== this.selectedCountry) {
            this.tempSelectedLanguage = null;
          }
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
        maximumAge: 300000,
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  private async getCountryFromCoordinates(
    lat: number,
    lng: number
  ): Promise<string | null> {
    try {
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
    if (this.showLanguageStep) {
      this.filterCountries();
    } else {
      this.filterLanguages();
    }
  }

  filterCountries() {
    if (!this.searchTerm) {
      this.filteredCountries = [...this.allCountries];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCountries = this.allCountries.filter(
        (c) =>
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
        (l) =>
          l.name.toLowerCase().includes(term) ||
          l.code.toLowerCase().includes(term)
      );
    }
  }

  selectCountry(country: Country) {
    this.tempSelectedCountry = country;
    if(this.tempSelectedCountry !== this.selectedCountry) {
      this.tempSelectedLanguage = null;
    }
  }

  selectLanguage(language: Language) {
    this.tempSelectedLanguage = language;
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
    if (this.tempSelectedCountry && this.tempSelectedLanguage) {
      this.selectedCountry = this.tempSelectedCountry;
      this.selectedLanguage = this.tempSelectedLanguage;
      this.select.emit({
        country: this.tempSelectedCountry,
        language: this.tempSelectedLanguage,
      });
    }
  }
}
