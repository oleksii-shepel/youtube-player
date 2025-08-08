// custom-table.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { createBehaviorSubject, createSubject } from '@actioncrew/streamix';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  filter?: string;
  sort?: { prop: string; dir: 'asc' | 'desc' };
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
  imports: [CommonModule, IonicModule, FormsModule]
})
export class GridComponent<T extends TableData> implements OnInit, OnDestroy {
  @Input() columns: TableColumn[] = [];
  @Input() title: string = '';
  @Input() pageSize: number = 10;
  @Input() showActions: boolean = true;
  @Input() serverSidePagination: boolean = false;
  @Input() data: Table<T> = {
    total: 0,
    pages: [],
    pageSize: this.pageSize
  };

  @Output() add = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() pageChange = new EventEmitter<{page: number, pageSize: number}>();

  public Math = Math;

  // Streamix subjects for reactive state management
  private destroy$ = createSubject<void>();
  private dataSource$ = createBehaviorSubject<Table<T>>(this.data);
  private searchText$ = createBehaviorSubject<string>('');
  private sortConfig$ = createBehaviorSubject<SortConfig>({ column: '', direction: 'asc' });
  private pagination$ = createBehaviorSubject<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: this.pageSize,
    totalItems: this.data.total,
    totalPages: Math.ceil(this.data.total / this.pageSize)
  });
  private modalState$ = createBehaviorSubject<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    selectedItem: T | null;
  }>({
    isOpen: false,
    mode: 'add',
    selectedItem: null
  });

  // Current state values (for template binding)
  searchText: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  isModalOpen: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedItem: T | null = null;

  // Derived data for display
  filteredData: T[] = [];
  paginatedData: T[] = [];

  constructor(
    private alertController: AlertController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.itemsPerPage = this.pageSize;

    // Initialize subjects with current data
    this.dataSource$.next(this.data);
    this.updatePaginationFromTable();

    // Subscribe to state changes
    this.setupSubscriptions();

    // Initial data processing
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].isFirstChange()) {
      this.dataSource$.next(this.data);
      this.updatePaginationFromTable();
      this.processData();
    }

    if (changes['pageSize'] && !changes['pageSize'].isFirstChange()) {
      this.itemsPerPage = this.pageSize;
      this.updatePaginationFromTable();
      this.processData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePaginationFromTable() {
    this.pagination$.next({
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems: this.data.total,
      totalPages: Math.ceil(this.data.total / this.itemsPerPage)
    });
  }

  private setupSubscriptions() {
    // Subscribe to search text changes
    this.searchText$.subscribe(searchText => {
      this.searchText = searchText;
      this.processData();
    });

    // Subscribe to sort configuration changes
    this.sortConfig$.subscribe(config => {
      this.sortColumn = config.column;
      this.sortDirection = config.direction;
      this.processData();
    });

    // Subscribe to pagination changes
    this.pagination$.subscribe(pagination => {
      this.currentPage = pagination.currentPage;
      this.itemsPerPage = pagination.itemsPerPage;
      this.totalPages = pagination.totalPages;

      if (this.serverSidePagination) {
        this.pageChange.emit({
          page: this.currentPage,
          pageSize: this.itemsPerPage
        });
      } else {
        this.updatePaginatedData();
      }
    });

    // Subscribe to data source changes
    this.dataSource$.subscribe(tableData => {
      this.data = tableData;
      this.processData();
    });

    // Subscribe to modal state changes
    this.modalState$.subscribe(state => {
      this.isModalOpen = state.isOpen;
      this.modalMode = state.mode;
      this.selectedItem = state.selectedItem;
    });
  }

  private processData() {
    // Get all items from pages
    const allItems = this.data.pages.flatMap(page => page.items);

    // Filter data if not server-side
    if (!this.serverSidePagination) {
      this.filteredData = allItems.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(this.searchText.toLowerCase())
        )
      );

      // Sort data if not server-side
      if (this.sortColumn) {
        this.filteredData.sort((a, b) => {
          const aVal = a[this.sortColumn];
          const bVal = b[this.sortColumn];

          let comparison = 0;
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
          } else {
            comparison = aVal - bVal;
          }

          return this.sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    } else {
      this.filteredData = allItems;
    }

    // Update pagination
    const totalPages = this.serverSidePagination
      ? Math.ceil(this.data.total / this.itemsPerPage)
      : Math.ceil(this.filteredData.length / this.itemsPerPage);

    const currentPage = Math.min(this.currentPage, totalPages || 1);

    this.pagination$.next({
      currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems: this.serverSidePagination ? this.data.total : this.filteredData.length,
      totalPages
    });
  }

  private updatePaginatedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Public methods for template
  onSearchChange(event: any) {
    const searchText = event.detail.value;
    this.searchText$.next(searchText);

    // Reset to first page when searching
    const currentPagination = this.pagination$.snappy;
    this.pagination$.next({
      ...currentPagination,
      currentPage: 1
    });
  }

  onSort(columnKey: string) {
    const column = this.columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    const currentSort = this.sortConfig$.snappy;

    if (currentSort.column === columnKey) {
      this.sortConfig$.next({
        column: columnKey,
        direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      this.sortConfig$.next({
        column: columnKey,
        direction: 'asc'
      });
    }
  }

  getSortIcon(columnKey: string): string {
    if (this.sortColumn !== columnKey) return '';
    return this.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  onPageSizeChange(event: any) {
    const itemsPerPage = parseInt(event.detail.value);
    this.itemsPerPage = itemsPerPage;

    const currentPagination = this.pagination$.snappy;
    this.pagination$.next({
      ...currentPagination,
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(currentPagination.totalItems / itemsPerPage)
    });
  }

  goToPage(page: number) {
    const currentPagination = this.pagination$.snappy;
    if (page >= 1 && page <= currentPagination.totalPages) {
      this.pagination$.next({
        ...currentPagination,
        currentPage: page
      });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisible / 2);
      let start = Math.max(1, this.currentPage - half);
      let end = Math.min(this.totalPages, start + maxVisible - 1);

      if (end === this.totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  onAdd() {
    this.modalState$.next({
      isOpen: true,
      mode: 'add',
      selectedItem: null
    });
  }

  onEdit(item: T) {
    this.modalState$.next({
      isOpen: true,
      mode: 'edit',
      selectedItem: { ...item }
    });
  }

  async onDelete(item: T) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete this item?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.delete.emit(item);

            // Remove from local data if no parent handling
            if (this.delete.observers.length === 0) {
              this.removeItem(item.id);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  onSave() {
    const currentModal = this.modalState$.snappy;
    if (!currentModal.selectedItem) return;

    if (currentModal.mode === 'add') {
      this.add.emit(currentModal.selectedItem);

      // Add to local data if no parent handling
      if (this.add.observers.length === 0) {
        this.addItem(currentModal.selectedItem);
      }
    } else {
      this.edit.emit(currentModal.selectedItem);

      // Update local data if no parent handling
      if (this.edit.observers.length === 0) {
        this.updateItem(currentModal.selectedItem);
      }
    }

    this.closeModal();
  }

  closeModal() {
    this.modalState$.next({
      isOpen: false,
      mode: 'add',
      selectedItem: null
    });
  }

  onInputChange(key: string, value: any) {
    const currentModal = this.modalState$.snappy;
    if (!currentModal.selectedItem) {
      this.modalState$.next({
        ...currentModal,
        selectedItem: { [key]: value } as T
      });
      return;
    }

    const updatedItem = { ...currentModal.selectedItem, [key]: value };
    this.modalState$.next({
      ...currentModal,
      selectedItem: updatedItem
    });
  }

  // Data manipulation methods
  updateData(newData: Table<T>) {
    this.data = newData;
    this.dataSource$.next(newData);
  }

  addItem(item: T) {
    const newData = {...this.data};
    if (newData.pages.length === 0) {
      newData.pages.push({
        items: [item],
        pageIndex: 0
      });
    } else {
      newData.pages[0].items.unshift(item);
    }
    newData.total += 1;
    this.updateData(newData);
  }

  updateItem(item: T) {
    const newData = {...this.data};
    newData.pages = newData.pages.map(page => ({
      ...page,
      items: page.items.map(i => i.id === item.id ? item : i)
    }));
    this.updateData(newData);
  }

  removeItem(itemId: string) {
    const newData = {...this.data};
    newData.pages = newData.pages.map(page => ({
      ...page,
      items: page.items.filter(i => i.id !== itemId)
    }));
    newData.total = Math.max(0, newData.total - 1);
    this.updateData(newData);
  }
}
