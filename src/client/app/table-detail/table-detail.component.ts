import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription, forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { saveAs } from 'file-saver';

import { AuthService } from '../auth/auth.service';
import { UtilsService } from '../utils.service';
import { SylvesterApiService } from '../sylvester-api.service';
import { TableRowEditorDialogComponent, TableRowEditorDialogData } from './table-row-editor-dialog/table-row-editor-dialog.component';
import { CollectionChanges, TableStructureEditorDialogComponent, TableStructureEditorDialogData } from '../table-structure-editor-dialog/table-structure-editor-dialog.component';
import { SylvesterCollection } from '../nelnet/sylvester-collection';
import { CONFIRM_DIALOG_MODE, ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ExportTableFilenameDialogComponent } from './export-table-filename-dialog/export-table-filename-dialog.component';
import { SylvesterMessengerService } from '../sylvester-messenger.service';

@Component({
  selector: 'app-table-detail',
  templateUrl: './table-detail.component.html',
  styleUrls: ['./table-detail.component.scss']
})
export class TableDetailComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;

  userID!: string;

  dataTableName!: string ;
  dataTableDescription!: string;
  showControlButtons: boolean = true;
  dataTable!: SylvesterCollection;
  canEdit!: boolean;
  canExport: boolean = false;
  canDelete: boolean = false;
  canAlter: boolean = false;

  displayData!: any[];
  sortedData!: any[];
  displayedColumns!: string[];

  tableNameSubscription!: Subscription;
  activeRouteSubscription!: Subscription;
  tablesUpdatedSubscription!: Subscription;

  currentSort: Sort = {active: '', direction: ''};

  showFilter: boolean= false;
  filterColumns: string[] = [];
  selectedFilterColumn: string = '';
  filterString: string = '';

  tableRowEditorDialogRef!: MatDialogRef<TableRowEditorDialogComponent>;
  tableStructureEditorDialogRef!: MatDialogRef<TableStructureEditorDialogComponent>;
  confirmationDialogRef!: MatDialogRef<ConfirmationDialogComponent>;
  exportFilenameDialogRef!: MatDialogRef<ExportTableFilenameDialogComponent>;

  constructor (
    private auth: AuthService,
    private router: Router,
    private utils: UtilsService,
    private activeRoute: ActivatedRoute,
    private apiService: SylvesterApiService,
    private dialog: MatDialog,
    private messenger: SylvesterMessengerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const userID = this.auth.getUserID();
    if (userID) {
      this.userID = userID;
      this.getUserPermissions();
    }

    const lsSortActive = localStorage.getItem(`${this.dataTableName}_sortActive`);
    const lsSortDirection = localStorage.getItem(`${this.dataTableName}_sortDirection`);
    if (lsSortActive && lsSortDirection) {
      this.currentSort.active = lsSortActive;
      this.currentSort.direction = lsSortDirection === 'asc' ? 'asc' : 'desc';
    }

    this.activeRouteSubscription = this.activeRoute.params.subscribe(params => {
      this.dataTableName = params['dataTableName'];

      this.filterString = '';
      this.selectedFilterColumn = '';
      this.getTableData();
    })


    this.tablesUpdatedSubscription = this.messenger.tablesUpdated.subscribe(updated => {
      if (updated) {
        this.getTableData();
      }
    })
  }

  ngOnDestroy(): void {
    this.activeRouteSubscription.unsubscribe();
    this.tablesUpdatedSubscription.unsubscribe();
  }

  getTableData(): void {
    this.isLoading = true;

    if (this.userID) {
      const tableData = this.apiService.getTable(this.dataTableName);
      const permissions = this.apiService.getTablePermissionsForTableName(this.userID, this.dataTableName);

      forkJoin([tableData, permissions]).subscribe(([table, permissions]) => {
        this.canEdit = permissions;
        this.dataTable = table;
        this.displayData = table.rows.slice();
        this.sortData(this.currentSort);
  
        this.dataTableDescription = table.description;
        this.displayedColumns = table.columns.map(col => col.name);
        this.filterColumns = table.columns.map(col => col.name);
  
        this.isLoading = false;
      })
    } else {
      this.router.navigate(['/homePage']);;
    }
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

  getUserPermissions(): void {
    if (this.userID) {
      this.apiService.getUserInfo(this.userID).subscribe(userInfo => {
        if (userInfo.canExport) {
          this.canExport = userInfo.canExport;
        }

        if (userInfo.canDeleteTable) {
          this.canDelete = userInfo.canDeleteTable;
        }

        if (userInfo.canAlterTable) {
          this.canAlter = userInfo.canAlterTable;
        }
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
      new: false,
      canEdit: this.canEdit
    }

    this.tableRowEditorDialogRef = this.dialog.open(TableRowEditorDialogComponent, {data: dialogData, disableClose: true, height: '90%'});

    this.tableRowEditorDialogRef.afterClosed().subscribe(dialogResp => {
      if (dialogResp) {
        if (dialogResp.action === 'save') {
          this.apiService.updateDocument(this.dataTableName, dialogResp.document).subscribe(resp => {
            if (resp.status === 'OK') {
              this.snackBar.open('Table changes saved', 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
              this.getTableData();
            } else {
              alert(`There were errors saving your changes: ${resp.message}`);
            }
          })
        } else if (dialogResp.action === 'delete') {
          this.apiService.deleteDocument(this.dataTableName, this.dataTable.rows[index]._id).subscribe(resp => {
            if (resp.status === 'OK') {
              this.snackBar.open('Record deleted', 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
              this.getTableData();
            } else {
              alert(`There were errors deleting the record: ${resp.message}`);
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
      new: true,
      canEdit: this.canEdit
    }

    this.tableRowEditorDialogRef = this.dialog.open(TableRowEditorDialogComponent, {data: dialogData, disableClose: true, height: '90%'});

    this.tableRowEditorDialogRef.afterClosed().subscribe(dialogResp => {
      if (dialogResp && dialogResp.action === 'save') {
        this.apiService.insertDocument(this.dataTableName, dialogResp.document).subscribe(resp => {
          if (resp.status === 'OK') {
            this.snackBar.open('New record added', 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
            this.getTableData();
          } else {
            alert(`There was an error adding the new record: ${resp.message}`);
          }
        })
      }
    })
  }

  editTableStructure(): void {
    const dialogData: TableStructureEditorDialogData = {
      tableName: this.dataTableName,
      tableDescription: this.dataTableDescription,
      fields: this.dataTable.columns
    }

    this.tableStructureEditorDialogRef = this.dialog.open(TableStructureEditorDialogComponent, {data: dialogData, disableClose: true, height: '90%'});
    this.tableStructureEditorDialogRef.afterClosed().subscribe(dialogResp => {
      if (dialogResp) {
        const changes: CollectionChanges = dialogResp;
        if (changes.newDescription || changes.fieldChanges.length > 0) {
          this.apiService.alterCollection(this.dataTableName, changes).subscribe(resp => {
            if (resp.status === 'OK') {
              this.snackBar.open('Table structure changes saved', 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
              this.getTableData();
            } else {
              alert(`There was an error updating the table structure: ${resp.message}`);
            }
          })
        }
      }
    })
  }

  getTableClass(): string {
    if (this.showFilter) {
      return 'table-container-filter-active';
    } else {
      return 'table-container';
    }
  }

  exportTable(): void {
    this.exportFilenameDialogRef = this.dialog.open(ExportTableFilenameDialogComponent, {data: this.dataTableName, disableClose: true});

    this.exportFilenameDialogRef.afterClosed().subscribe(fileName => {
      if (fileName) {
        try {
          // Use this replacer to avoid 'null' showing up in the csv
          const replacer = (key: string, value: any) => value === null ? '' : value
          const header = this.dataTable.columns.map(col => col.name);
          const csv = [
            header.join(','),
            ...this.dataTable.rows.map(row => {
              return header.map(fieldName => {
                const val = JSON.stringify(row[fieldName], replacer)
                return val === '""' ? '' : val;
              }).join(',')
            })
          ].join('\r\n')

          saveAs(new Blob([csv], {type: 'text/csv'}), `${fileName}.csv`);
    
          const dialogData = {
            mode: CONFIRM_DIALOG_MODE.OK,
            title: 'Export Complete',
            messageArray: [`The ${this.dataTableName} table has been exported to a CSV file called "${fileName}.csv"`],
            messageCentered: true
          }
          this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
    
        } catch (err) {
          console.error(err);
          alert('There was an error exporting the table to a CSV file.');
        }
      }
    })
  }

  deleteTable(): void {
    const dialogData = {
      mode: CONFIRM_DIALOG_MODE.DELETE_CANCEL,
      title: 'Delete Table',
      messageArray: [`You are about to DELETE the ${this.dataTableName} table.`, 'This action can not be undone.', 'Are you sure you want to continue?'],
      messageCentered: true
    }
    this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
    this.confirmationDialogRef.afterClosed().subscribe(dialogResp => {
      if (dialogResp) {
        this.apiService.deleteCollection(this.dataTableName).subscribe(resp => {
          if (resp.status === 'OK') {
            const dialogData = {
              mode: CONFIRM_DIALOG_MODE.OK,
              title: 'Table Deleted',
              messageArray: [`The ${this.dataTableName} table has been deleted.`],
              messageCentered: true
            }
            this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
            this.confirmationDialogRef.afterClosed().subscribe(_ => {
              this.messenger.setTableDeleted(true);
              this.router.navigate(['/homePage']);
            })
          } else {
            alert(`There was an error deleting the ${this.dataTableName} table: ${resp.message}`);
          }
        })
      }
    })
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }
}
