import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DataTablesModule } from 'angular-datatables';

import { createSubject } from '@actioncrew/streamix';

@Component({
  selector: 'app-unified-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  imports: [CommonModule, IonicModule, DataTablesModule]
})
export class TableComponent implements OnInit, OnDestroy {
  @Input() label = 'Table';
  @Input() columns: { title: string, data: string }[] = [];
  @Input() data: any[] = [];

  @Input() addItemFn?: () => void;
  @Input() editItemFn?: (item: any) => void;
  @Input() deleteItemFn?: (item: any) => void;

  dtOptions: DataTables.Settings = {};
  dtTrigger = createSubject<void>();

  ngOnInit(): void {
    this.dtOptions = {
      pagingType: 'simple_numbers',
      pageLength: 10,
      searching: true,
      ordering: true,
      data: this.data,
      columns: [...this.columns, { title: 'Actions', data: null }]
    };
  }

  ngOnDestroy(): void {
    this.dtTrigger.complete();
  }
}
