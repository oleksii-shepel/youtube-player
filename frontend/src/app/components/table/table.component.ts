import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { NgxDatatableModule, SortType, TableColumn as NgxTableColumn, SortEvent } from '@swimlane/ngx-datatable';

export interface PageState<T> {
  items: T[];
  pages: T[][];
  pageIndex: number;
  nextPageToken: string | null;
  prevPageTokens: string[];
  filter: string;
  sortField?: keyof T;
  sortDirection?: 'asc' | 'desc';
}

export interface TableColumn<T> {
  name: string;
  prop: string; // Changed to string
  cellFn?: (item: T) => string | SafeHtml;
  sortable?: boolean;
  width?: number;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, NgxDatatableModule]
})
export class TableComponent<T extends Record<string, any>> implements OnInit, OnChanges {
  @Input() label!: string;
  @Input() state!: PageState<T>;
  @Input() getPageFn!: (token?: string) => Promise<{ items: T[]; nextPageToken?: string }>;
  @Input() columns: TableColumn<T>[] = [];
  @Input() renderRowFn?: (item: T) => string;
  @Input() addItemFn?: () => Promise<void> | void;
  @Input() loading = false;
  @Input() emptyMessage = 'No data available';

  @Output() deleteItem = new EventEmitter<T>();
  @Output() editItem = new EventEmitter<T>();
  @Output() stateChange = new EventEmitter<PageState<T>>();

  filterValue = '';
  errorMessage = signal<string | null>(null);
  sortType = SortType.single;

  get ngxColumns(): NgxTableColumn[] {
    return this.columns.map(col => ({
      name: col.name,
      prop: col.prop,
      sortable: col.sortable !== false,
      width: col.width
    }));
  }

  ngOnInit(): void {
    if (!this.state.pages.length) {
      this.loadPage();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['state'] && !changes['state'].firstChange) {
      this.applyCurrentPageFilters();
    }
  }

  async loadPage(pageToken?: string): Promise<void> {
    this.loading = true;
    this.errorMessage.set(null);

    try {
      const res = await this.getPageFn(pageToken);
      const items = res.items || [];

      if (!pageToken) {
        this.state.pages = [items];
        this.state.pageIndex = 0;
        this.state.prevPageTokens = [];
      } else {
        this.state.pages.push(items);
        this.state.pageIndex++;
        this.state.prevPageTokens.push(pageToken);
      }

      this.state.items = this.applyFilters(items);
      this.state.nextPageToken = res.nextPageToken || null;
      this.emitStateChange();
    } catch (err) {
      console.error(`Failed to load ${this.label}`, err);
      this.errorMessage.set(`Failed to load ${this.label}. Please try again.`);
      this.state.items = [];
    } finally {
      this.loading = false;
    }
  }

  nextPage(): void {
    if (this.state.nextPageToken) {
      this.loadPage(this.state.nextPageToken);
    }
  }

  prevPage(): void {
    if (this.state.pageIndex > 0) {
      this.state.pageIndex--;
      this.state.prevPageTokens.pop();
      this.applyCurrentPageFilters();
    }
  }

  private applyCurrentPageFilters(): void {
    const currentItems = this.state.pages[this.state.pageIndex] || [];
    this.state.items = this.applyFilters(currentItems);
    this.emitStateChange();
  }

  private applyFilters(items: T[]): T[] {
    let filtered = [...items];

    if (this.state.filter) {
      const lower = this.state.filter.toLowerCase();
      filtered = filtered.filter(item =>
        JSON.stringify(item).toLowerCase().includes(lower)
      );
    }

    if (this.state.sortField) {
      filtered = this.sortItems(filtered);
    }

    return filtered;
  }

  private sortItems(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const field = this.state.sortField!;
      const aValue = a[field];
      const bValue = b[field];
      const direction = this.state.sortDirection === 'desc' ? -1 : 1;

      if (aValue == null) return direction;
      if (bValue == null) return -direction;

      return (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) * direction;
    });
  }

  private emitStateChange(): void {
    this.stateChange.emit({...this.state});
  }

  onFilterChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement?.value ?? '';
    this.state.filter = value.trim();
    this.applyCurrentPageFilters();
  }

  async onSort(event: SortEvent) {
    // Ensure event.sorts[0].prop is treated as keyof T | string
    const sort = event.sorts[0];
    if (!sort) return;

    const column = sort.prop as keyof T | string;
    const sortOrder = sort.dir === 'asc' ? 1 : -1;

    this.state.items.sort((a: any, b: any) => {
      // Handle both keyof T and string cases
      const aValue = typeof column === 'string' && column in a ? a[column] : '';
      const bValue = typeof column === 'string' && column in b ? b[column] : '';
      return aValue > bValue ? sortOrder : aValue < bValue ? -sortOrder : 0;
    });

    this.stateChange.emit(this.state);
  }

  async onAdd(): Promise<void> {
    if (this.addItemFn) {
      try {
        await this.addItemFn();
      } catch (err) {
        console.error('Failed to add item', err);
        this.errorMessage.set('Failed to add item. Please try again.');
      }
    }
  }

  onDelete(item: T): void {
    this.deleteItem.emit(item);
  }

  onEdit(item: T): void {
    this.editItem.emit(item);
  }
}
