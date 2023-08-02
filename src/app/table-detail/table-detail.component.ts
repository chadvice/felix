import { Component, OnInit, OnDestroy } from '@angular/core';

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
  dataTableName: string = '';
  dataTable: table | null = null;
  displayData!: row[];
  tableNameSubscription!: Subscription;

  constructor (
    private messenger: SylvesterMessengerService,
    private apiService: SylvesterApiService
  ) {}

  ngOnInit(): void {
    this.tableNameSubscription = this.messenger.detailTableName.subscribe(tableName => {
      this.dataTableName = tableName;

      this.getTableData();
    })

  }

  ngOnDestroy(): void {
    this.tableNameSubscription.unsubscribe();
  }

  getTableData(): void {
    this.apiService.getTable(this.dataTableName).subscribe(table => {
      this.dataTable = table;
      this.displayData = table.data.rows;
      console.log();
    })
  }

  getDisplayedColumns(): string[] {
    if (this.dataTable) {
      return this.dataTable?.data.columns .map(col => col.name)
    } else {
      return [];
    }
  }

  rowClicked(row: any): void {

  }
}
