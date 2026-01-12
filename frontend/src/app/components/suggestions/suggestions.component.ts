import {
  Component, EventEmitter, Input, Output,
  ViewChild, AfterViewInit, OnDestroy, Renderer2,
  ChangeDetectorRef, TemplateRef, ApplicationRef,
  ViewContainerRef, Inject,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  createBehaviorSubject,
  createSubject,
  merge,
  Stream,
  Subscription
} from '@epikodelabs/streamix';
import { onResize } from '@epikodelabs/streamix/dom';
import { filter, map, switchMap, takeUntil } from '@epikodelabs/streamix';
import { GoogleSuggestionsService } from 'src/app/services/suggestions.service';
import { AppearanceSettings } from 'src/app/interfaces/settings';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-suggestions-dropdown',
  template: `
    <ng-template #dropdownTemplate>
      <div class="suggestions-dropdown scrollable"
           [ngStyle]="dropdownStyle">
        <div class="suggestions-list">
          @for (suggestion of suggestions; track suggestion; let i = $index) {
            <div class="suggestion-item"
                 [class.selected]="i === selectedSuggestionIndex"
                 (mousedown)="$event.preventDefault(); selectSuggestion(suggestion)">
              <ion-icon name="search-outline" size="small"></ion-icon>
              <span>{{ suggestion }}</span>
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .suggestions-dropdown {
      margin-top: 8px;
      background: var(--ion-overlay-background);
      border: 1px solid var(--ion-border-color);
      border-radius: 10px;
      box-shadow: 0 8px 20px var(--ion-box-shadow-color);
      z-index: 1000;
      padding: 8px;
      max-height: 250px;
      overflow-y: auto;
      opacity: 0;
      transform: translateY(-10px);
      animation: fadeInSlideUp 0.2s forwards ease-out;
      transform-origin: top;
    }

    @keyframes fadeInSlideUp {
      from { opacity: 0; transform: translateY(-10px) scaleY(0.95); }
      to { opacity: 1; transform: translateY(0) scaleY(1); }
    }

    .suggestions-list {
      display: flex;
      flex-direction: column;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: var(--ion-text-color);
      cursor: pointer;
      border-radius: 8px;
      transition: background-color 0.2s ease, color 0.2s ease;
      font-size: 0.95em;
    }

    .suggestion-item:hover {
      background-color: var(--ion-item-background-hover);
    }
    .suggestion-item.selected {
      background-color: var(--ion-item-background-activated);
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SuggestionsComponent implements AfterViewInit, OnDestroy {
  @Input() searchQuery: string = '';
  @Input() appearanceSettings!: AppearanceSettings;
  @Input() searchContainer!: HTMLElement;
  @Output() suggestionSelected = new EventEmitter<string>();
  @Output() suggestionsChanged = new EventEmitter<string[]>();

  @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;

  public suggestions: string[] = [];
  public selectedSuggestionIndex: number = -1;
  public dropdownStyle: any = {};
  public readonly dropdownOpen$ = createBehaviorSubject<boolean>(false);

  private dropdownElement: HTMLElement | null = null;
  private readonly destroy$ = createSubject<void>();
  private readonly queryChanged$ = createBehaviorSubject<string>("");
  private subscriptions: Subscription[] = [];
  private viewAttached = false;
  private appRoot: HTMLElement | null = null;
  constructor(
    private googleSuggestionsService: GoogleSuggestionsService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private viewContainerRef: ViewContainerRef,
    private appRef: ApplicationRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngAfterViewInit(): void {
    this.createDropdownContainer();
    this.setupStreams();

    if (this.searchQuery.length >= 2) {
      this.queryChanged$.next(this.searchQuery);
    }
  }

  private createDropdownContainer(): void {
    if (this.viewAttached) return;  // Prevent double attachment

    this.dropdownElement = this.document.createElement('div');
    this.appRoot = this.document.querySelector('ion-app');
    if (this.appRoot) {
      this.appRoot.appendChild(this.dropdownElement);
    };

    const viewRef = this.viewContainerRef.createEmbeddedView(this.dropdownTemplate);
    viewRef.rootNodes.forEach(node => {
      this.renderer.appendChild(this.dropdownElement, node);
    });

    this.viewAttached = true;
  }

  private cleanupDropdown(): void {
    if (!this.viewAttached) return;

    if (this.appRoot && this.dropdownElement) {
      this.appRoot.removeChild(this.dropdownElement);
      this.appRoot = null;
      this.dropdownElement = null;
    }

    this.viewAttached = false;  // Mark as detached
  }

  ngOnDestroy(): void {
    this.cleanupDropdown();
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupStreams(): void {
    this.subscriptions.push(
      this.queryChanged$
        .pipe(
          filter((query: string) => query.length >= 2),
          switchMap((query: string) => this.fetchSuggestions(query)),
          takeUntil(this.destroy$)
        )
        .subscribe((suggestions) => {
          this.suggestions = suggestions;
          this.suggestionsChanged.emit(suggestions);
          this.dropdownOpen$.next(suggestions.length > 0);
          this.selectedSuggestionIndex = -1;
          this.positionDropdown();
          this.cdr.detectChanges();
        }),

      merge(
        onResize(this.searchContainer).pipe(map(() => true)),
        this.dropdownOpen$
      )
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(() => this.positionDropdown())
    );
  }

  private positionDropdown(): void {
    if (this.searchContainer && this.dropdownElement) {
      const rect = this.searchContainer.getBoundingClientRect();

      this.renderer.setStyle(this.dropdownElement, 'position', 'fixed');
      this.renderer.setStyle(this.dropdownElement, 'top', `${rect.bottom + window.scrollY + 8}px`);
      this.renderer.setStyle(this.dropdownElement, 'left', `${rect.left + window.scrollX}px`);
      this.renderer.setStyle(this.dropdownElement, 'width', `${rect.width}px`);
      this.renderer.setStyle(this.dropdownElement, 'z-index', '1000');
      this.renderer.setStyle(this.dropdownElement, 'display',
        this.shouldShowDropdown ? 'block' : 'none');
    }
  }

  get shouldShowDropdown(): boolean {
    return this.appearanceSettings?.autoComplete === 'dropdown' &&
           this.dropdownOpen$.value &&
           this.suggestions.length > 0;
  }

  updateQuery(query: string): void {
    this.searchQuery = query;
    if (query.length >= 2) {
      this.queryChanged$.next(query);
    } else {
      this.dropdownOpen$.next(false);
      this.suggestions = [];
    }
  }

  selectSuggestion(suggestion: string): void {
    this.suggestionSelected.emit(suggestion);
    this.suggestions = [];
    this.dropdownOpen$.next(false);
    this.selectedSuggestionIndex = -1;
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.dropdownOpen$.value) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.selectedSuggestionIndex = Math.min(
            this.selectedSuggestionIndex + 1,
            this.suggestions.length - 1
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.selectedSuggestionIndex = Math.max(
            this.selectedSuggestionIndex - 1,
            -1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (this.selectedSuggestionIndex >= 0) {
            this.selectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
          }
          break;
        case 'Escape':
          this.dropdownOpen$.next(false);
          break;
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const searchContainer = this.searchContainer;
    const dropdownElement = this.dropdownElement;

    if (searchContainer && dropdownElement && this.dropdownOpen$.value) {
      if (!searchContainer.contains(event.target as Node) &&
          !dropdownElement.contains(event.target as Node)) {
        this.dropdownOpen$.next(false);
      }
    }
  }

  private fetchSuggestions(query: string): Stream<string[]> {
    return this.googleSuggestionsService.getSuggestions(query);
  }

  onFocus(): void {
    if (this.suggestions.length > 0 && this.searchQuery.trim().length > 2) {
      this.dropdownOpen$.next(true);
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.dropdownOpen$.next(false);
      this.selectedSuggestionIndex = -1;
    }, 150);
  }
}
