import { Component, OnInit, OnDestroy } from '@angular/core';

import { SylvesterApiService } from '../sylvester-api.service';
import { SylvesterMessengerService } from '../sylvester-messenger.service';
import { table } from '../nelnet/nelnet-table';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-table-detail',
  templateUrl: './table-detail.component.html',
  styleUrls: ['./table-detail.component.scss']
})
export class TableDetailComponent implements OnInit, OnDestroy {
  tableName: string = '';
  table: table | null = null;
  tableNameSubscription!: Subscription;

  constructor (
    private messenger: SylvesterMessengerService,
    private apiService: SylvesterApiService
  ) {}

  ngOnInit(): void {
    this.tableNameSubscription = this.messenger.detailTableName.subscribe(tableName => {
      this.tableName = tableName;

      this.getTableData();
    })

  }

  ngOnDestroy(): void {
    this.tableNameSubscription.unsubscribe();
  }

  getTableData(): void {
    this.apiService.getTable(this.tableName).subscribe(table => {
      this.table = table;
    })
  }
}
