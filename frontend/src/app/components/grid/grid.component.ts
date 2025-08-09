// grid.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, SimpleChanges, OnChanges } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';
import { createBehaviorSubject, createSubject } from '@actioncrew/streamix';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntil } from '@actioncrew/streamix';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: string;
  options?: string[];
  size?: string;
}

export interface TableData {
  id: string;
  [key: string]: any;
}

export interface Page<T = TableData> {
  items: T[];
  pageIndex: number;
  pageToken?: string;
}

export interface Table<T = TableData> {
  total: number;
  pages: Page<T>[];
  pageSize: number;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-grid',
  templateUrl: 'grid.component.html',
  styleUrls: ['grid.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class GridComponent<T extends TableData> implements OnInit, OnDestroy, OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() title: string = '';
  @Input() pageSize: number = 10;
  @Input() showActions: boolean = true;
  @Input() data: Table<T> = {
    total: 0,
    pages: [],
    pageSize: 10,
  };

  @Output() add = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();
  @Output() sortChange = new EventEmitter<{ sort: SortConfig }>();
  @Output() searchChange = new EventEmitter<{ searchText: string }>();

  public Math = Math;

  private currentItemsById = new Map<string, T>();
  private destroy$ = createSubject<void>();
  private dataSource$ = createBehaviorSubject<Table<T>>(this.data);
  private searchText$ = createBehaviorSubject<string>('');
  private sortConfig$ = createBehaviorSubject<SortConfig>({
    column: '',
    direction: 'asc',
  });
  private pagination$ = createBehaviorSubject<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  });
  private modalState$ = createBehaviorSubject<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    selectedItem: T | null;
  }>({
    isOpen: false,
    mode: 'add',
    selectedItem: null,
  });

  searchText: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  isModalOpen: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedItem: T | null = null;

  paginatedData: T[] = [];

  constructor(private alertController: AlertController) {}

  ngOnInit() {
    this.itemsPerPage = this.pageSize;
    this.setupSubscriptions();
    // Initial data is handled by ngOnChanges.
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const currentData = changes['data'].currentValue as Table<T>;
      this.dataSource$.next(currentData);
      this.updatePagination(currentData);
    }
    if (changes['pageSize'] && !changes['pageSize'].firstChange) {
      this.itemsPerPage = changes['pageSize'].currentValue;
      this.updatePagination(this.data);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePagination(data: Table<T>): void {
    const totalPages = Math.max(1, Math.ceil(data.total / (data.pageSize || this.pageSize)));
    const currentPage = Math.min(Math.max(1, this.currentPage), totalPages);

    const newPagination = {
      currentPage,
      itemsPerPage: data.pageSize || this.pageSize,
      totalItems: data.total,
      totalPages,
    };
    this.pagination$.next(newPagination);
  }

  private setupSubscriptions() {
    this.dataSource$.pipe(takeUntil(this.destroy$)).subscribe((tableData) => {
      this.data = tableData;
      this.updatePaginatedData();
    });

    this.searchText$.pipe(takeUntil(this.destroy$)).subscribe((searchText) => {
      this.searchText = searchText;
      this.searchChange.emit({ searchText });
    });

    this.sortConfig$.pipe(takeUntil(this.destroy$)).subscribe((config) => {
      this.sortColumn = config.column;
      this.sortDirection = config.direction;
      this.sortChange.emit({ sort: config });
    });

    this.pagination$.pipe(takeUntil(this.destroy$)).subscribe((pagination) => {
      const pageChanged = this.currentPage !== pagination.currentPage;
      this.currentPage = pagination.currentPage;
      this.itemsPerPage = pagination.itemsPerPage;
      this.totalPages = pagination.totalPages;

      if (pageChanged) {
        this.pageChange.emit({
          page: this.currentPage,
          pageSize: this.itemsPerPage,
        });
      }
      this.updatePaginatedData();
    });

    this.modalState$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.isModalOpen = state.isOpen;
      this.modalMode = state.mode;
      this.selectedItem = state.selectedItem;
    });
  }

  private updatePaginatedData() {
    const targetPageIndex = this.currentPage - 1;
    const currentPageData = this.data.pages.find(page => page.pageIndex === targetPageIndex);

    const newPaginatedData = currentPageData?.items || [];
    if (newPaginatedData.length === 0) return;

    // Efficiently update paginatedData to avoid unnecessary DOM changes
    const newItemsById = new Map<string, T>();
    newPaginatedData.forEach(item => newItemsById.set(item.id, item));

    // Find items to remove and add
    const itemsToRemove = this.paginatedData.filter(item => !newItemsById.has(item.id));
    const itemsToAdd = newPaginatedData.filter(item => !this.currentItemsById.has(item.id));

    // Update the array in place if possible
    let shouldReplaceArray = false;
    if (itemsToRemove.length > 0 || itemsToAdd.length > 0 || this.paginatedData.length !== newPaginatedData.length) {
      shouldReplaceArray = true;
    } else {
      // If the lengths are the same, just update the item data in place
      for (let i = 0; i < this.paginatedData.length; i++) {
        const newItem = newPaginatedData[i];
        if (this.paginatedData[i].id === newItem.id) {
          // Update the existing object's properties
          Object.assign(this.paginatedData[i], newItem);
        } else {
          shouldReplaceArray = true;
          break;
        }
      }
    }

    if (shouldReplaceArray) {
      this.paginatedData = newPaginatedData;
    }

    this.currentItemsById = newItemsById;
  }

  trackByItemId(index: number, item: T): string {
    return item.id;
  }

  onSearchChange(event: any) {
    const searchText = event.detail.value;
    this.searchText$.next(searchText);
    const currentPagination = this.pagination$.snappy;
    this.pagination$.next({
      ...currentPagination,
      currentPage: 1,
    });
  }

  onSort(columnKey: string) {
    const column = this.columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;
    const currentSort = this.sortConfig$.snappy;
    if (currentSort.column === columnKey) {
      this.sortConfig$.next({
        column: columnKey,
        direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      this.sortConfig$.next({
        column: columnKey,
        direction: 'asc',
      });
    }
  }

  getSortIcon(columnKey: string): string {
    if (this.sortColumn !== columnKey) return '';
    return this.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  onPageSizeChange(event: any) {
    const itemsPerPage = parseInt(event.detail.value);
    const currentPagination = this.pagination$.snappy;
    this.pagination$.next({
      ...currentPagination,
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(currentPagination.totalItems / itemsPerPage),
    });
  }

  goToPage(page: number) {
    const currentPagination = this.pagination$.snappy;
    if (page < 1 || page > currentPagination.totalPages || page === this.currentPage) {
      return;
    }
    this.pagination$.next({
      ...currentPagination,
      currentPage: page,
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const currentPage = this.currentPage;
    const totalPages = this.totalPages;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = start + maxVisible - 1;
      if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - maxVisible + 1);
      }
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push(-1);
      }
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) pages.push(i);
      }
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push(-1);
        pages.push(totalPages);
      }
    }
    return pages;
  }

  onAdd() { this.modalState$.next({ isOpen: true, mode: 'add', selectedItem: null }); }
  onEdit(item: T) { this.modalState$.next({ isOpen: true, mode: 'edit', selectedItem: { ...item } }); }
  async onDelete(item: T) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete this item?`,
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: () => { this.delete.emit(item); }, }],
    });
    await alert.present();
  }

  onSave() {
    const currentModal = this.modalState$.snappy;
    if (!currentModal.selectedItem) return;
    if (currentModal.mode === 'add') {
      this.add.emit(currentModal.selectedItem);
    } else {
      this.edit.emit(currentModal.selectedItem);
    }
    this.closeModal();
  }

  closeModal() { this.modalState$.next({ isOpen: false, mode: 'add', selectedItem: null }); }
  onInputChange(key: string, value: any) {
    const currentModal = this.modalState$.snappy;
    const updatedItem = currentModal.selectedItem ? { ...currentModal.selectedItem, [key]: value } : { [key]: value } as T;
    this.modalState$.next({ ...currentModal, selectedItem: updatedItem });
  }

  updateData(newData: Table<T>) {
    this.dataSource$.next(newData);
  }

  setCurrentPage(pageIndex: number): void {
    this.goToPage(pageIndex + 1);
  }

  addItem(item: T) {
    const newData = { ...this.data };
    if (newData.pages.length === 0) {
      newData.pages.push({
        items: [item],
        pageIndex: 0,
      });
    } else {
      newData.pages[0].items.unshift(item);
    }
    newData.total += 1;
    this.updateData(newData);
  }

  updateItem(item: T) {
    const newData = { ...this.data };
    newData.pages = newData.pages.map((page) => ({
      ...page,
      items: page.items.map((i) => (i.id === item.id ? item : i)),
    }));
    this.updateData(newData);
  }

  removeItem(itemId: string) {
    const newData = { ...this.data };
    newData.pages = newData.pages.map((page) => ({
      ...page,
      items: page.items.filter((i) => i.id !== itemId),
    }));
    newData.total = Math.max(0, newData.total - 1);
    this.updateData(newData);
  }

  // Debug methods
  debugPaginationState(): void {
    console.log('=== PAGINATION DEBUG ===');
    console.log('Current page:', this.currentPage);
    console.log('Items per page:', this.itemsPerPage);
    console.log('Total pages:', this.totalPages);
    console.log('Available pages:', this.data.pages.map(p => ({
      pageIndex: p.pageIndex,
      itemCount: p.items.length,
      hasPageToken: !!p.pageToken
    })));
    console.log('Current paginated data length:', this.paginatedData.length);
    console.log('Current paginated data:', this.paginatedData);
    console.log('========================');
  }

  // TrackBy functions for performance
  trackByPageIndex(index: number, page: Page<T>): number {
    return page.pageIndex;
  }
}
