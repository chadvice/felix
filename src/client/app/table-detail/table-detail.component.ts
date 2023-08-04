import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { UtilsService } from '../utils.service';
import { SylvesterApiService } from '../sylvester-api.service';
import { table } from '../nelnet/nelnet-table';
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

  displayData!: any[];
  sortedData!: any[];
  displayedColumns!: string[];

  tableNameSubscription!: Subscription;
  activeRouteSubscription!: Subscription;

  currentSort: Sort = {active: '', direction: ''};

  constructor (
    private utils: UtilsService,
    private activeRoute: ActivatedRoute,
    private apiService: SylvesterApiService
  ) {}

  ngOnInit(): void {
    const lsSortActive = localStorage.getItem(`${this.dataTableName}_sortActive`);
    const lsSortDirection = localStorage.getItem(`${this.dataTableName}_sortDirection`);
    if (lsSortActive && lsSortDirection) {
      this.currentSort.active = lsSortActive;
      this.currentSort.direction = lsSortDirection === 'asc' ? 'asc' : 'desc';
    }

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
      this.sortData(this.currentSort);
      this.displayedColumns = table.data.columns.map(col => col.name);

      this.isLoading = false;
    })
  }

  sortData(sort: Sort): void {
    this.currentSort = sort;
    localStorage.setItem(`${this.dataTableName}_sortActive`, this.currentSort.active);
    localStorage.setItem(`${this.dataTableName}_sortDirection`, this.currentSort.direction);
    const data = this.displayData.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      return this.utils.compare(a[sort.active], b[sort.active], isAsc);
    });
  }

  rowClicked(row: any): void {
    console.log();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }
}
