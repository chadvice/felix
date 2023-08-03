import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { SylvesterApiService } from '../sylvester-api.service';
import { row, table } from '../nelnet/nelnet-table';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-table-detail',
  templateUrl: './table-detail.component.html',
  styleUrls: ['./table-detail.component.scss']
})
export class TableDetailComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;

  @Input() dataTableName: string = '';
  @Input() dataTableDescription: string = '';
  @Input() showControlButtons: boolean = true;
  dataTable!: table;

  displayData!: row[];
  displayedColumns!: string[];

  tableNameSubscription!: Subscription;
  activeRouteSubscription!: Subscription;

  constructor (
    private activeRoute: ActivatedRoute,
    private apiService: SylvesterApiService
  ) {}

  ngOnInit(): void {
    this.activeRouteSubscription = this.activeRoute.params.subscribe(params => {
      this.dataTableName = params['dataTableName'];
      this.dataTableDescription = params['dataTableDescription'];

      this.getTableData();
    })
  }

  ngOnDestroy(): void {
    this.activeRouteSubscription.unsubscribe();
  }

  getTableData(): void {
    this.isLoading = true;
    let tableData$: Observable<table>;

    // If we were called without a dataTableName then we get all of the tables
    if (this.dataTableName) {
      tableData$ = this.apiService.getTable(this.dataTableName);
    } else {
      tableData$ = this.apiService.getTables();
    }

    tableData$.subscribe(table => {
      this.dataTable = table;
      this.displayData = table.data.rows.slice();
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
