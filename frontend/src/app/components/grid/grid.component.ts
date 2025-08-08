// custom-table.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';
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
  [key: string]: any;
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
export class GridComponent implements OnInit, OnDestroy {
  @Input() data: TableData[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() title: string = '';
  @Input() pageSize: number = 10;
  @Input() showActions: boolean = true;

  @Output() add = new EventEmitter<TableData>();
  @Output() edit = new EventEmitter<TableData>();
  @Output() delete = new EventEmitter<TableData>();

  public Math = Math;

  // Streamix subjects for reactive state management
  private destroy$ = createSubject<void>();
  private dataSource$ = createBehaviorSubject<TableData[]>([]);
  private searchText$ = createBehaviorSubject<string>('');
  private sortConfig$ = createBehaviorSubject<SortConfig>({ column: '', direction: 'asc' });
  private pagination$ = createBehaviorSubject<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });
  private modalState$ = createBehaviorSubject<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    selectedItem: TableData;
  }>({
    isOpen: false,
    mode: 'add',
    selectedItem: {}
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
  selectedItem: TableData = {};

  filteredData: TableData[] = [];
  paginatedData: TableData[] = [];

  constructor(
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.itemsPerPage = this.pageSize;
    this.data = this.data ?? [];

    // Initialize subjects
    this.dataSource$.next(this.data);
    this.pagination$.next({
      currentPage: 1,
      itemsPerPage: this.pageSize,
      totalItems: this.data.length,
      totalPages: Math.ceil(this.data.length / this.pageSize)
    });

    // Subscribe to state changes
    this.setupSubscriptions();

    // Initial data processing
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if the 'data' input property has changed.
    if (changes['data'] && !changes['data'].isFirstChange()) {
      // Update the internal data source with the new data.
      this.dataSource$.next(changes['data'].currentValue);
    } else if (changes['data'] && changes['data'].isFirstChange()) {
      // For the first change, handle it here to ensure it's processed after subscriptions.
      this.dataSource$.next(changes['data'].currentValue);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
      this.updatePaginatedData();
    });

    // Subscribe to modal state changes
    this.modalState$.subscribe(state => {
      this.isModalOpen = state.isOpen;
      this.modalMode = state.mode;
      this.selectedItem = state.selectedItem;
    });

    // Subscribe to data source changes
    this.dataSource$.subscribe(data => {
      this.data = data;
      this.processData();
    });
  }

  private processData() {
    // Filter data
    this.filteredData = this.data.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(this.searchText.toLowerCase())
      )
    );

    // Sort data
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

    // Update pagination
    const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    const currentPage = Math.min(this.currentPage, totalPages || 1);

    this.pagination$.next({
      currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems: this.filteredData.length,
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

  onAdd() {
    this.modalState$.next({
      isOpen: true,
      mode: 'add',
      selectedItem: {}
    });
  }

  onEdit(item: TableData) {
    this.modalState$.next({
      isOpen: true,
      mode: 'edit',
      selectedItem: { ...item }
    });
  }

  async onDelete(item: TableData) {
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
              const currentData = this.dataSource$.snappy as any[];
              const updatedData = currentData.filter(d => d.id !== item['id']);
              this.dataSource$.next(updatedData);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  onSave() {
    const currentModal = this.modalState$.snappy;

    if (currentModal.mode === 'add') {
      this.add.emit(currentModal.selectedItem);

      // Add to local data if no parent handling
      if (this.add.observers.length === 0) {
        const currentData = this.dataSource$.snappy as any[];
        const newId = Math.max(...currentData.map(d => d.id || 0)) + 1;
        const newItem = { ...currentModal.selectedItem, id: newId };
        this.dataSource$.next([...currentData, newItem]);
      }
    } else {
      this.edit.emit(currentModal.selectedItem);

      // Update local data if no parent handling
      if (this.edit.observers.length === 0) {
        const currentData = this.dataSource$.snappy as any[];
        const updatedData = currentData.map(d =>
          d.id === currentModal.selectedItem['id'] ? { ...currentModal.selectedItem } : d
        );
        this.dataSource$.next(updatedData);
      }
    }

    this.closeModal();
  }

  closeModal() {
    this.modalState$.next({
      isOpen: false,
      mode: 'add',
      selectedItem: {}
    });
  }

  onInputChange(key: string, value: any) {
    const currentModal = this.modalState$.snappy;
    const updatedItem = { ...currentModal.selectedItem, [key]: value };

    this.modalState$.next({
      ...currentModal,
      selectedItem: updatedItem
    });
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

  // Public methods to update data externally
  updateData(newData: TableData[]) {
    this.dataSource$.next(newData);
  }

  addItem(item: TableData) {
    const currentData = this.dataSource$.snappy as any[];
    const newId = Math.max(...currentData.map(d => d.id || 0)) + 1;
    this.dataSource$.next([...currentData, { ...item, id: newId }]);
  }

  updateItem(item: TableData) {
    const currentData = this.dataSource$.snappy as any[];
    const updatedData = currentData.map(d => d.id === item['id'] ? { ...item } : d);
    this.dataSource$.next(updatedData);
  }

  removeItem(itemId: any) {
    const currentData = this.dataSource$.snappy as any[];
    const updatedData = currentData.filter(d => d.id !== itemId);
    this.dataSource$.next(updatedData);
  }
}
