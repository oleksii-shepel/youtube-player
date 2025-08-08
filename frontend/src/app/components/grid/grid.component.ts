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
  imports: [CommonModule, IonicModule, FormsModule],
})
export class GridComponent<T extends TableData> implements OnInit, OnDestroy {
  @Input() columns: TableColumn[] = [];
  @Input() title: string = '';
  @Input() pageSize: number = 10;
  @Input() showActions: boolean = true;
  @Input() serverSidePagination: boolean = true;
  @Input() data: Table<T> = {
    total: 0,
    pages: [],
    pageSize: this.pageSize,
  };

  @Output() add = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();

  public Math = Math;

  // Streamix subjects for reactive state management
  private destroy$ = createSubject<void>();
  private dataSource$ = createBehaviorSubject<Table<T>>(this.data);
  private searchText$ = createBehaviorSubject<string>('');
  private sortConfig$ = createBehaviorSubject<SortConfig>({
    column: '',
    direction: 'asc',
  });
  private pagination$ = createBehaviorSubject<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: this.pageSize,
    totalItems: this.data.total,
    totalPages: Math.ceil(this.data.total / this.pageSize),
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
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.itemsPerPage = this.pageSize;

    // Initialize with current data
    this.dataSource$.next(this.data);

    // Process initial data
    this.processData();

    // Set up subscriptions
    this.setupSubscriptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update data source if @Input() data changed
    if (changes['data']) {
      const newData = changes['data'].currentValue as Table<T>;
      this.dataSource$.next(newData);

      // Update pagination config
      this.pagination$.next({
        currentPage: 1,
        itemsPerPage: newData.pageSize || this.pageSize,
        totalItems: newData.total,
        totalPages: Math.ceil(
          newData.total / (newData.pageSize || this.pageSize)
        ),
      });

      // Update view bindings
      this.currentPage = 1;
      this.itemsPerPage = newData.pageSize || this.pageSize;
      this.totalPages = Math.ceil(newData.total / this.itemsPerPage);

      if (!this.serverSidePagination) {
        const firstPage = newData.pages?.[0]?.items ?? [];
        this.paginatedData = firstPage;
        this.filteredData = firstPage;
      }
    }

    // Update pageSize if changed
    if (changes['pageSize']) {
      this.itemsPerPage = changes['pageSize'].currentValue;
    }

    // Optionally reset sort/filter on relevant changes
    if (changes['columns']) {
      this.sortColumn = '';
      this.sortDirection = 'asc';
      this.searchText = '';
      this.searchText$.next('');
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
      totalPages: Math.ceil(this.data.total / this.itemsPerPage),
    });
  }

  private setupSubscriptions() {
    // Subscribe to search text changes
    this.searchText$.subscribe((searchText) => {
      this.searchText = searchText;
      this.processData();
    });

    // Subscribe to sort configuration changes
    this.sortConfig$.subscribe((config) => {
      this.sortColumn = config.column;
      this.sortDirection = config.direction;
      this.processData();
    });

    // Subscribe to pagination changes
    this.pagination$.subscribe((pagination) => {
      this.currentPage = pagination.currentPage;
      this.itemsPerPage = pagination.itemsPerPage;
      this.totalPages = pagination.totalPages;

      if (this.serverSidePagination) {
        this.pageChange.emit({
          page: this.currentPage,
          pageSize: this.itemsPerPage,
        });
      } else {
        this.updatePaginatedData();
      }
    });

    // Subscribe to data source changes
    this.dataSource$.subscribe((tableData) => {
      this.data = tableData;
      this.processData();
    });

    // Subscribe to modal state changes
    this.modalState$.subscribe((state) => {
      this.isModalOpen = state.isOpen;
      this.modalMode = state.mode;
      this.selectedItem = state.selectedItem;
    });
  }

  private processData() {
    // Get all items from pages for client-side operations
    const allItems = this.data.pages.flatMap((page) => page.items);

    // Filter data if not server-side
    if (!this.serverSidePagination) {
      this.filteredData = allItems.filter((item) =>
        Object.values(item).some((value) =>
          value
            ?.toString()
            .toLowerCase()
            .includes(this.searchText.toLowerCase())
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
      // For server-side, we'll use the current page's items
      this.filteredData = allItems; // This is just for count/display purposes
    }

    // Calculate totals
    const totalItems = this.serverSidePagination
      ? this.data.total
      : this.filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / this.itemsPerPage));

    // Ensure current page is valid
    const currentPage = Math.min(Math.max(1, this.currentPage), totalPages);

    // Update pagination state
    this.pagination$.next({
      currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems,
      totalPages,
    });

    // Update the visible data
    this.updatePaginatedData();
  }

  private updatePaginatedData() {
    if (this.serverSidePagination) {
      // For server-side pagination, we assume the current page's items are in data.pages
      const currentPageData = this.data.pages.find(
        (page) => page.pageIndex === this.currentPage - 1
      );
      this.paginatedData = currentPageData?.items || [];
    } else {
      // For client-side pagination, slice the filtered data
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.paginatedData = this.filteredData.slice(startIndex, endIndex);

      // Auto-correct current page if we have no items but data exists
      if (
        this.paginatedData.length === 0 &&
        this.filteredData.length > 0 &&
        this.currentPage > 1
      ) {
        this.goToPage(Math.ceil(this.filteredData.length / this.itemsPerPage));
      }
    }
  }

  // Public methods for template
  onSearchChange(event: any) {
    const searchText = event.detail.value;
    this.searchText$.next(searchText);

    // Reset to first page when searching
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
    this.itemsPerPage = itemsPerPage;

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
    if (
      page >= 1 &&
      page <= currentPagination.totalPages &&
      page !== this.currentPage
    ) {
      this.currentPage = page;
      this.pagination$.next({
        ...currentPagination,
        currentPage: page,
      });

      if (!this.serverSidePagination) {
        this.updatePaginatedData();
      }
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const currentPage = this.currentPage;
    const totalPages = this.totalPages;

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end pages
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = start + maxVisible - 1;

      if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - maxVisible + 1);
      }

      // Always show first page
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push(-1); // Use -1 to represent ellipsis
        }
      }

      // Add visible pages
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) {
          pages.push(i);
        }
      }

      // Always show last page
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push(-1); // Use -1 to represent ellipsis
        }
        pages.push(totalPages);
      }
    }

    return pages;
  }

  onAdd() {
    this.modalState$.next({
      isOpen: true,
      mode: 'add',
      selectedItem: null,
    });
  }

  onEdit(item: T) {
    this.modalState$.next({
      isOpen: true,
      mode: 'edit',
      selectedItem: { ...item },
    });
  }

  async onDelete(item: T) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete this item?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
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
          },
        },
      ],
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
      selectedItem: null,
    });
  }

  onInputChange(key: string, value: any) {
    const currentModal = this.modalState$.snappy;
    if (!currentModal.selectedItem) {
      this.modalState$.next({
        ...currentModal,
        selectedItem: { [key]: value } as T,
      });
      return;
    }

    const updatedItem = { ...currentModal.selectedItem, [key]: value };
    this.modalState$.next({
      ...currentModal,
      selectedItem: updatedItem,
    });
  }

  // Data manipulation methods
  updateData(newData: Table<T>) {
    this.data = newData;
    this.dataSource$.next(newData);
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
}
