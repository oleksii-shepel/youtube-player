import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import * as countries from 'i18n-iso-countries';
import englishCountries from 'i18n-iso-countries/langs/en.json';
import { DirectiveModule } from 'src/app/directives';
import { Country } from 'src/app/interfaces/settings';

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
    >
      <div
        class="modal-container"
        [class.hidden]="!isOpen"
        [class.with-border]="showBorder"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="modal-header">
          <ion-toolbar>
            <ion-title>Select Country</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="onClose()">
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

        <!-- Content -->
        <div class="modal-content scrollable">
          @if (isLoading) {
            <div class="status-message">
              <ion-spinner name="crescent"></ion-spinner>
              Loading countries...
            </div>
          } @else {
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
                    [class.selected]="selectedCountry?.code === country.code"
                  >
                    <ion-label>
                      <h3>{{ country.name }}</h3>
                      <p>{{ country.nativeName }}</p>
                      <p class="country-code">{{ country.code }}</p>
                    </ion-label>
                    @if (selectedCountry?.code === country.code) {
                      <ion-icon
                        name="checkmark-circle"
                        slot="end"
                        color="primary"
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
        </div>

        <!-- Controls -->
        <div class="controls">
          <ion-button
            (click)="onCountrySelect(selectedCountry)"
            fill="solid"
            color="primary"
            [disabled]="!selectedCountry"
          >
            <ion-icon name="checkmark" slot="start"></ion-icon>
            Select {{ selectedCountry?.name ?? 'Country' }}
          </ion-button>
          <ion-button
            (click)="onClose()"
            fill="clear"
            color="primary"
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
  @Input() isOpen = false;
  @Input() showBorder = true;
  @Input() selectedCountry: Country | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() select = new EventEmitter<any>();

  allCountries: Country[] = [];
  filteredCountries: Country[] = [];
  searchTerm = '';
  isLoading = true;

  constructor() {
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
        .map(([code, name]) => ({
          code,
          name: name as string,
          nativeName: countries.getName(code, 'en') || (name as string),
        }))
        .filter(c => c.name && c.nativeName)
        .sort((a, b) => a.name.localeCompare(b.name));
      this.filteredCountries = [...this.allCountries];
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      this.isLoading = false;
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

  selectCountry(country: Country) {
    this.selectedCountry = country;
  }

  onClose() {
    this.close.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  onCountrySelect(country: any) {
    this.select.emit(country);
  }
}
