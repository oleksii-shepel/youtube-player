// language-select-modal.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import ISO6391 from 'iso-639-1';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

@Component({
  selector: 'app-language-select-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Select Language</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Search languages..."
          [(ngModel)]="searchTerm"
          (ionInput)="filterLanguages($event)"
          debounce="300"
          show-clear-button="focus"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <div class="scrollable">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading languages...</p>
      </div>

      <!-- Language List -->
      <div *ngIf="!isLoading">
        <ion-list>
          <ion-item
            *ngFor="let language of filteredLanguages; let i = index"
            button
            (click)="selectLanguage(language)"
            [class.selected]="selectedLanguage?.code === language.code"
          >
            <ion-label>
              <h3>{{ language.name }}</h3>
              <p>{{ language.nativeName }}</p>
              <p class="language-code">{{ language.code }}</p>
            </ion-label>

            <ion-icon
              *ngIf="selectedLanguage?.code === language.code"
              name="checkmark-circle"
              slot="end"
              color="primary"
            ></ion-icon>
          </ion-item>
        </ion-list>

        <!-- Empty State -->
        <div
          *ngIf="filteredLanguages.length === 0 && searchTerm && !isLoading"
          class="empty-state"
        >
          <ion-icon name="search-outline"></ion-icon>
          <p>No languages found</p>
          <p class="empty-subtext">Try adjusting your search terms</p>
        </div>

        <!-- Results Counter -->
        <div
          class="results-info"
          *ngIf="searchTerm && filteredLanguages.length > 0"
        >
          <small
            >{{ filteredLanguages.length }} of
            {{ allLanguages.length }} languages</small
          >
        </div>
      </div>
    </div>

    <ion-footer *ngIf="selectedLanguage">
      <ion-toolbar>
        <ion-button expand="block" fill="solid" (click)="confirmSelection()">
          Select {{ selectedLanguage.name }}
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

      .language-code {
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
export class LanguageSelectModalComponent implements OnInit {
  @Input() selectedLanguage: Language | null = null;

  allLanguages: Language[] = [];
  filteredLanguages: Language[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;

  constructor(private modalController: ModalController) {}

  async ngOnInit() {
    await this.loadLanguages();
  }

  async loadLanguages() {
    try {
      this.isLoading = true;

      // Simulate async loading (you can remove timeout if not needed)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Load all languages from ISO 639-1
      const languageCodes = ISO6391.getAllCodes();

      this.allLanguages = languageCodes
        .map((code) => ({
          code,
          name: ISO6391.getName(code),
          nativeName: ISO6391.getNativeName(code),
        }))
        .filter((lang) => lang.name && lang.nativeName) // Filter out any invalid entries
        .sort((a, b) => a.name.localeCompare(b.name));

      this.filteredLanguages = [...this.allLanguages];
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading languages:', error);
      this.isLoading = false;
      // You could show an error toast here
    }
  }

  filterLanguages(event: any) {
    const searchTerm = event.target.value?.toLowerCase() || '';
    this.searchTerm = searchTerm;

    if (!searchTerm) {
      this.filteredLanguages = [...this.allLanguages];
      return;
    }

    this.filteredLanguages = this.allLanguages.filter(
      (language) =>
        language.name.toLowerCase().includes(searchTerm) ||
        language.nativeName.toLowerCase().includes(searchTerm) ||
        language.code.toLowerCase().includes(searchTerm)
    );
  }

  selectLanguage(language: Language) {
    this.selectedLanguage = language;
  }

  confirmSelection() {
    if (this.selectedLanguage) {
      this.modalController.dismiss(this.selectedLanguage);
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
