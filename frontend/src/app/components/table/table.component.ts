import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule, ColumnMode } from '@siemens/ngx-datatable';

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
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    NgxDatatableModule
  ]
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

  columnMode = ColumnMode.force;
  headerHeight = 50;
  footerHeight = 0;
  rowHeight: 'auto' | number = 'auto';
  limit = 10;
  offset = 0;
  count = 0;

  rowsPerPageOptions = [5, 10, 25, 50];

  public Math = Math;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.initializeColumns();
    this.updateRows();
    console.log('Initial data:', this.data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.initializeColumns();
      this.updateRows();
      console.log('Data changed:', this.data);
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
    const start = this.offset;
    const end = start + this.limit;
    this.rows = this.data.slice(start, end);
    this.count = this.data.length;
    console.log('Updated rows:', this.rows, 'Offset:', this.offset, 'Limit:', this.limit);
  }

  onPage(event: { offset: number; pageSize: number }): void {
    this.offset = event.offset;
    this.limit = event.pageSize;
    this.updateRows();
    console.log('Page event triggered:', event);
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

  ngOnDestroy(): void {}

  getColumnByProp(prop: string): { name: string; prop: string; cellFn?: (item: any) => string; clickable?: boolean } {
    const column = this.columns.find(col => col.prop === prop);
    if (!column) {
      console.warn(`Column with prop '${prop}' not found, returning default column`);
      return { name: prop, prop: prop, cellFn: undefined, clickable: false };
    }
    return column;
  }
}
