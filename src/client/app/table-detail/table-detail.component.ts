import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { UtilsService } from '../utils.service';
import { SylvesterApiService } from '../sylvester-api.service';
import { column, table } from '../nelnet/nelnet-table';
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

  showFilter: boolean= false;
  filterColumns: string[] = [];
  selectedFilterColumn: string = '';
  filterString: string = '';

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

      this.filterString = '';
      this.selectedFilterColumn = '';
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
      this.filterColumns = table.data.columns.filter(col => col.type === 'varchar').map(col => col.name);

      this.isLoading = false;
    })
  }

  sortData(sort: Sort): void {
    this.currentSort = sort;
    localStorage.setItem(`${this.dataTableName}_sortActive`, this.currentSort.active);
    localStorage.setItem(`${this.dataTableName}_sortDirection`, this.currentSort.direction);
    const data = this.getFilteredData().slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      return this.utils.compare(a[sort.active], b[sort.active], isAsc);
    });
  }

  getFilteredData(): any[] {
    if (this.filterString.length === 0) {
      return this.displayData;
    } else {
      return this.displayData.filter(row => {
        if (this.selectedFilterColumn.length > 0) {
          if (row[this.selectedFilterColumn] === null) {
            return false;
          }
  
          if (row[this.selectedFilterColumn].toLowerCase().indexOf(this.filterString.toLowerCase()) === -1) {
            return false;
          }
        }
        
        return true;
      })
    }
  }

  toggleShowFilter(): void {
    this.showFilter = !this.showFilter;
  }
  
  filterColumnChanged(): void {
    this.filterString = '';
    this.sortData(this.currentSort);
  }

  onFilterChange(): void {
    this.sortData(this.currentSort);
  }

  clearFilter(): void {
    this.selectedFilterColumn = '';
    this.filterColumnChanged();
    this.showFilter = false;
  }

  rowClicked(row: any): void {
    console.log();
  }

  getTableClass(): string {
    if (this.showFilter) {
      return 'table-container-filter-active';
    } else {
      return 'table-container';
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }
}
