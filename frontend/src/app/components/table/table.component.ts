import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
  NgxDatatableModule,
  ColumnMode,
  SortEvent,
  SortPropDir,
  SortDirection
} from '@siemens/ngx-datatable';

// Define the structure for NgxDatatable columns
interface DatatableColumn {
  prop: string;
  name: string;
  sortable?: boolean;
  resizeable?: boolean;
  canAutoResize?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flexGrow?: number;
  cellFn?: (item: any) => string;
  clickable?: boolean;
}

// Type for table data
export interface TableData {
  [key: string]: any;
}

@Component({
  selector: 'app-unified-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, IonicModule, FormsModule, NgxDatatableModule]
})
export class TableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() label = 'Table';
  @Input() columns: { name: string; prop: string; cellFn?: (item: any) => string; clickable?: boolean }[] = [];
  @Input() data: TableData[] = [];

  @Input() addItemFn?: () => void;
  @Input() editItemFn?: (item: TableData) => void;
  @Input() deleteItemFn?: (item: TableData) => void;

  datatableColumns: DatatableColumn[] = [];
  rows: TableData[] = [];
  filteredData: TableData[] = [];

  columnMode = ColumnMode.force;
  headerHeight = 50;
  footerHeight = 0;
  rowHeight: 'auto' | number = 'auto';
  limit = 10;
  offset = 0;
  count = 0;

  rowsPerPageOptions = [5, 10, 25, 50];
  sorts: SortPropDir[] = []; // Initialize as empty, adjust as needed

  searchTerm = '';
  public Math = Math;
  public SortDirection = SortDirection;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.filteredData = [...this.data];
    this.initializeColumns();
    this.updateRows();
    console.log('Initial sorts:', this.sorts); // Debug initial sort state
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.filteredData = [...this.data];
      this.initializeColumns();
      this.updateRows();
    }
  }

  initializeColumns(): void {
    this.datatableColumns = this.columns.map(col => ({
      prop: col.prop,
      name: col.name,
      sortable: true,
      resizeable: true,
      cellFn: col.cellFn,
      clickable: col.clickable
    }));
  }

  updateRows(): void {
    const source = this.filteredData.length ? this.filteredData : this.data;
    const start = this.offset;
    const end = start + this.limit;
    this.rows = source.slice(start, end);
    this.count = source.length;
    console.log('Updated rows:', this.rows, 'Sorts:', this.sorts); // Debug rows and sorts
  }

  onPage(event: { offset: number; pageSize: number }): void {
    this.offset = event.offset;
    this.limit = event.pageSize;
    this.updateRows();
  }

  onRowsPerPageChange(newLimit: number): void {
    this.limit = newLimit;
    this.offset = 0;
    this.updateRows();
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  addItem(): void {
    if (!this.addItemFn) {
      console.warn('addItemFn is not provided');
      return;
    }
    this.addItemFn();
  }

  editItem(item: TableData): void {
    if (!this.editItemFn) {
      console.warn('editItemFn is not provided');
      return;
    }
    this.editItemFn(item);
  }

  deleteItem(item: TableData): void {
    if (!this.deleteItemFn) {
      console.warn('deleteItemFn is not provided');
      return;
    }
    this.deleteItemFn(item);
  }

  isSelected(rowData: TableData): boolean {
    return false;
  }

  getColumnByProp(prop: string): { name: string; prop: string; cellFn?: (item: any) => string; clickable?: boolean } {
    const column = this.columns.find(col => col.prop === prop);
    if (!column) {
      console.warn(`Column with prop '${prop}' not found, returning default column`);
      return { name: prop, prop: prop, cellFn: undefined, clickable: false };
    }
    return column;
  }

  onSort(event: SortEvent): void {
    this.sorts = event.sorts;
    this.sortRows();
    console.log('Sort event triggered:', this.sorts); // Debug sort event
  }

  sortRows(): void {
    const sorted = [...this.filteredData];
    for (const sort of this.sorts) {
      sorted.sort((a, b) => {
        const aVal = a[sort.prop];
        const bVal = b[sort.prop];
        return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (sort.dir === SortDirection.asc ? 1 : -1);
      });
    }
    this.filteredData = sorted;
    this.offset = 0;
    this.updateRows();
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(row =>
        this.columns.some(col =>
          row[col.prop]?.toString().toLowerCase().includes(term)
        )
      );
    }
    this.offset = 0;
    this.updateRows();
  }

  onHeaderClick(prop: string): void {
    const currentSort = this.sorts.find(sort => sort.prop === prop);
    let newDir: SortDirection = SortDirection.asc;
    if (currentSort) {
      newDir = currentSort.dir === SortDirection.asc ? SortDirection.desc : SortDirection.asc;
      this.sorts = this.sorts.filter(sort => sort.prop !== prop);
    }
    this.sorts = [{ prop, dir: newDir }];
    this.sortRows();
    console.log('Header clicked, new sorts:', this.sorts);
  }

  isSorted(prop: string): boolean {
    return this.sorts.length > 0 && this.sorts[0].prop === prop;
  }

  ngOnDestroy(): void {}
}
