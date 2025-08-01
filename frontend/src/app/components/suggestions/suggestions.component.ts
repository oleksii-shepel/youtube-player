import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  TemplateRef,
  ViewContainerRef,
  AfterViewInit,
  OnDestroy,
  Renderer2
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  createBehaviorSubject,
  createSubject,
  merge,
  onResize,
  Stream,
  Subscription
} from '@actioncrew/streamix';
import { filter, map, switchMap, takeUntil } from '@actioncrew/streamix';
import { GoogleSuggestionsService } from 'src/app/services/suggestions.service';
import { AppearanceSettings } from 'src/app/interfaces/settings';

@Component({
  selector: 'app-suggestions-dropdown',
  template: `
    <ng-template #dropdownTpl>
      @if (appearanceSettings && appearanceSettings.autoComplete === 'dropdown' && dropdownOpen$.snappy && suggestions.length > 0) {
        <div
          class="suggestions-dropdown scrollable"
          #suggestionsDropdown
          [ngStyle]="dropdownStyle"
        >
          <div class="suggestions-list">
            @for (suggestion of suggestions; track suggestion; let i = $index) {
              <div
                class="suggestion-item"
                [class.selected]="i === selectedSuggestionIndex"
                (mousedown)="$event.preventDefault(); selectSuggestion(suggestion)"
                (click)="selectSuggestion(suggestion)"
              >
                <ion-icon name="search-outline" size="small"></ion-icon>
                <span>{{ suggestion }}</span>
              </div>
            }
          </div>
        </div>
      }
    </ng-template>
  `,
  styles: [`
    .suggestions-dropdown {
      position: fixed;
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
      from {
        opacity: 0;
        transform: translateY(-10px) scaleY(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scaleY(1);
      }
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

    .suggestion-item ion-icon {
      color: var(--ion-text-color-muted);
      font-size: 1.1em;
    }

    .suggestion-item:hover {
      background-color: var(--ion-item-background-hover);
      color: var(--ion-text-color-heading);
    }

    .suggestion-item.selected {
      background-color: var(--ion-item-background-activated);
      color: var(--ion-text-color-heading);
      font-weight: 500;
    }

    .suggestion-item span {
      flex-grow: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .suggestions-chips {
      position: relative;
      margin-top: 8px;
      background: var(--ion-overlay-background);
      border: 1px solid var(--ion-border-color);
      border-radius: 12px;
      box-shadow: 0 8px 20px var(--ion-box-shadow-color);
      padding: 8px;
      z-index: 1000;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      animation: fadeInSlideUp 0.2s forwards ease-out;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SuggestionsComponent implements AfterViewInit, OnDestroy {
  @Input() searchQuery: string = '';
  @Input() appearanceSettings!: AppearanceSettings;
  @Input() searchContainer!: HTMLElement;
  @Input() suggestionsContainer!: ViewContainerRef;
  @Output() suggestionSelected = new EventEmitter<string>();
  @Output() suggestionsChanged = new EventEmitter<string[]>();

  public suggestions: string[] = [];
  public selectedSuggestionIndex: number = -1;
  public dropdownStyle: any = {};
  public readonly dropdownOpen$ = createBehaviorSubject<boolean>(false);

  @ViewChild('dropdownTpl') dropdownTpl!: TemplateRef<any>;
  @ViewChild('suggestionsDropdown') suggestionsDropdown!: ElementRef<HTMLElement>;

  private portalViewRef: any;
  private readonly destroy$ = createSubject<void>();
  private readonly queryChanged$ = createBehaviorSubject<string>("");
  private subscriptions: Subscription[] = [];
  constructor(
    private googleSuggestionsService: GoogleSuggestionsService,
    private viewContainerRef: ViewContainerRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    if (this.appearanceSettings?.autoComplete === 'dropdown') {
      this.portalViewRef = this.dropdownTpl.createEmbeddedView({});
      this.viewContainerRef.insert(this.portalViewRef);
      const rootNode = this.portalViewRef.rootNodes[0];
      if (rootNode) {
        document.body.appendChild(rootNode);
      }
    }

    this.setupStreams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.portalViewRef) {
      this.portalViewRef.destroy();
    }
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
          this.dropdownOpen$.next(suggestions.length > 0);
          this.selectedSuggestionIndex = -1;
          this.suggestionsChanged.emit(suggestions);
        }),

      merge(
        onResize(this.searchContainer).pipe(map(() => true)),
        this.dropdownOpen$
      )
        .pipe(
          filter((value: boolean) => value),
          takeUntil(this.destroy$)
        )
        .subscribe(() => this.positionDropdown())
    );

    if (this.searchQuery.length >= 2) {
      this.queryChanged$.next(this.searchQuery);
    }
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
    if (this.dropdownOpen$.snappy) {
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
          this.selectedSuggestionIndex = -1;
          break;
      }
    }
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

  onDocumentClick(event: MouseEvent): boolean {
    const searchContainer = this.searchContainer;
    if (
      searchContainer &&
      !searchContainer.contains(event.target as Node) &&
      this.dropdownOpen$.snappy
    ) {
      this.dropdownOpen$.next(false);
      return false;
    }
    return true;
  }

  private positionDropdown(): void {
    if (this.searchContainer && this.dropdownOpen$.snappy) {
      requestAnimationFrame(() => {
        const rect = this.searchContainer.getBoundingClientRect();

        this.dropdownStyle = {
          position: 'fixed',
          top: `${rect.bottom + 8}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: '1000',
        };
      });
    } else {
      this.dropdownStyle = {};
    }
  }

  private fetchSuggestions(query: string): Stream<string[]> {
    return this.googleSuggestionsService.getSuggestions(query);
  }
}
