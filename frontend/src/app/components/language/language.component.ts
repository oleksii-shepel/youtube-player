// language-select-modal.component.ts
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
import ISO6391 from 'iso-639-1';
import { DirectiveModule } from 'src/app/directives';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

@Component({
  selector: 'app-language-select-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, DirectiveModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['language.component.scss'],
  template: `
    <div
      class="modal-backdrop"
      [class.hidden]="!isOpen"
      (click)="onClose()"
    >
      <div
        class="modal-container"
        [class.hidden]="!isOpen"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="modal-header">
          <ion-toolbar>
            <ion-title>Select Language</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="onClose()">
                <ion-icon name="close"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              placeholder="Search languages..."
              [(ngModel)]="searchTerm"
              (ionInput)="filterLanguages()"
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
              Loading languages...
            </div>
          } @else {
            @if (filteredLanguages.length === 0 && searchTerm) {
              <div class="overlay">
                <ion-icon name="search-outline" size="large"></ion-icon>
                <p>No languages found</p>
                <p>Try adjusting your search terms</p>
              </div>
            } @else {
              <ion-list>
                @for (language of filteredLanguages; track language.code) {
                  <ion-item
                    button
                    (click)="selectLanguage(language)"
                    [class.selected]="selectedLanguage?.code === language.code"
                  >
                    <ion-label>
                      <h3>{{ language.name }}</h3>
                      <p>{{ language.nativeName }}</p>
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
              @if (searchTerm && filteredLanguages.length > 0) {
                <div class="status-message">
                  {{ filteredLanguages.length }} of {{ allLanguages.length }} languages
                </div>
              }
            }
          }
        </div>

        <!-- Controls -->
        <div class="controls">
          <ion-button
            (click)="onLanguageSelect(selectedLanguage)"
            fill="solid"
            color="primary"
            [disabled]="!selectedLanguage"
          >
            <ion-icon name="checkmark" slot="start"></ion-icon>
            Select {{ selectedLanguage?.name ?? 'Language' }}
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
})
export class LanguageSelectModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() selectedLanguage: Language | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() select = new EventEmitter<Language>();

  allLanguages: Language[] = [];
  filteredLanguages: Language[] = [];
  searchTerm = '';
  isLoading = true;

  async ngOnInit() {
    await this.loadLanguages();
  }

  async loadLanguages() {
    try {
      this.isLoading = true;
      const codes = ISO6391.getAllCodes();
      this.allLanguages = codes
        .map(code => ({
          code,
          name: ISO6391.getName(code),
          nativeName: ISO6391.getNativeName(code),
        }))
        .filter(l => l.name && l.nativeName)
        .sort((a, b) => a.name.localeCompare(b.name));
      this.filteredLanguages = [...this.allLanguages];
    } catch (err) {
      console.error('Failed to load languages', err);
    } finally {
      this.isLoading = false;
    }
  }

  filterLanguages() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredLanguages = [...this.allLanguages];
      return;
    }
    this.filteredLanguages = this.allLanguages.filter(
      l =>
        l.name.toLowerCase().includes(term) ||
        l.nativeName.toLowerCase().includes(term) ||
        l.code.toLowerCase().includes(term)
    );
  }

  selectLanguage(lang: Language) {
    this.selectedLanguage = lang;
  }

  onLanguageSelect(lang: Language | null) {
    if (lang) this.select.emit(lang);
  }

  onClose() {
    this.cancel.emit();
    this.close.emit();
  }
}
