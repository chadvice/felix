import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';

import { UtilsService } from '../utils.service';
import { SylvesterApiService } from '../sylvester-api.service';
import { TableRowEditorDialogComponent, TableRowEditorDialogData } from '../table-row-editor-dialog/table-row-editor-dialog.component';
import { TableStructureEditorDialogComponent, TableStructureEditorDialogData } from '../table-structure-editor-dialog/table-structure-editor-dialog.component';
import { SylvesterCollection } from '../nelnet/sylvester-collection';

@Component({
  selector: 'app-table-detail',
  templateUrl: './table-detail.component.html',
  styleUrls: ['./table-detail.component.scss']
})
export class TableDetailComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;

  dataTableName!: string ;
  dataTableDescription!: string;
  showControlButtons: boolean = true;
  dataTable!: SylvesterCollection;

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

  tableRowEditorDialogRef!: MatDialogRef<TableRowEditorDialogComponent>;
  tableStructureEditorDialogRef!: MatDialogRef<TableStructureEditorDialogComponent>;

  constructor (
    private utils: UtilsService,
    private activeRoute: ActivatedRoute,
    private apiService: SylvesterApiService,
    private dialog: MatDialog
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

    this.apiService.getTable(this.dataTableName).subscribe(table => {
      this.dataTable = table;
      this.displayData = table.rows.slice();
      this.sortData(this.currentSort);
      this.displayedColumns = table.columns.map(col => col.name);
      this.filterColumns = table.columns.map(col => col.name);

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

  rowClicked(clickedRow: number): void {
    const index = this.dataTable.rows.findIndex(row => row._id === this.sortedData[clickedRow]._id);
    const dialogData: TableRowEditorDialogData = {
      tableName: this.dataTableName,
      tableDescription: this.dataTableDescription,
      cols: this.dataTable.columns,
      record: {...this.dataTable.rows[index]},
      new: false
    }

    this.tableRowEditorDialogRef = this.dialog.open(TableRowEditorDialogComponent, {data: dialogData, disableClose: true, height: '90%'});

    this.tableRowEditorDialogRef.afterClosed().subscribe(dialogResp => {
      if (dialogResp) {
        if (dialogResp.action === 'save') {
          this.apiService.updateDocument(this.dataTableName, dialogResp.document).subscribe(resp => {
            if (resp.status === 'OK') {
              this.getTableData();
            } else {
              //TODO: handle errors here
            }
          })
        } else if (dialogResp.action === 'delete') {
          this.apiService.deleteDocument(this.dataTableName, this.dataTable.rows[index]._id).subscribe(resp => {
            if (resp.status === 'OK') {
              this.getTableData();
            } else {
              //TODO: handle errors here
            }
          })
        }
      }
    })
  }

  addDocument(): void {
    const dialogData: TableRowEditorDialogData = {
      tableName: this.dataTableName,
      tableDescription: this.dataTableDescription,
      cols: this.dataTable.columns,
      record: {},
      new: true
    }

    this.tableRowEditorDialogRef = this.dialog.open(TableRowEditorDialogComponent, {data: dialogData, disableClose: true, height: '90%'});

    this.tableRowEditorDialogRef.afterClosed().subscribe(dialogResp => {
      if (dialogResp && dialogResp.action === 'save') {
        this.apiService.insertDocument(this.dataTableName, dialogResp.document).subscribe(resp => {
          if (resp.status === 'OK') {
            this.getTableData();
          } else {
            //TODO: handle errors here
          }
        })
      }
    })
  }

  editTableStructure(): void {
    const dialogData: TableStructureEditorDialogData = {
      tableName: this.dataTableName,
      tableDescription: this.dataTableDescription,
      cols: this.dataTable.columns
    }

    this.tableStructureEditorDialogRef = this.dialog.open(TableStructureEditorDialogComponent, {data: dialogData, disableClose: true, height: '90%'});
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
