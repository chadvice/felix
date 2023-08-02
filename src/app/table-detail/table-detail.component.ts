import { Component, OnInit, OnDestroy } from '@angular/core';
import {CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, DragDropModule} from '@angular/cdk/drag-drop';

import { SylvesterApiService } from '../sylvester-api.service';
import { SylvesterMessengerService } from '../sylvester-messenger.service';
import { row, table } from '../nelnet/nelnet-table';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-table-detail',
  templateUrl: './table-detail.component.html',
  styleUrls: ['./table-detail.component.scss']
})
export class TableDetailComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;

  dataTableName: string = '';
  dataTableDescription: string = '';
  dataTable: table | null = null;

  displayData!: row[];
  displayedColumns!: string[];

  tableNameSubscription!: Subscription;

  constructor (
    private messenger: SylvesterMessengerService,
    private apiService: SylvesterApiService
  ) {}

  ngOnInit(): void {
    this.tableNameSubscription = this.messenger.detailTableName.subscribe(tableInfo => {
      if (tableInfo) {
        this.dataTableName = tableInfo.name;
        this.dataTableDescription = tableInfo.description;
      }
      this.getTableData();
    })

  }

  ngOnDestroy(): void {
    this.tableNameSubscription.unsubscribe();
  }

  getTableData(): void {
    this.isLoading = true;
    this.apiService.getTable(this.dataTableName).subscribe(table => {
      this.dataTable = table;
      this.displayData = table.data.rows;
      this.displayedColumns = table.data.columns.map(col => col.name);

      this.isLoading = false;
    })
  }

  rowClicked(row: any): void {
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }
}
