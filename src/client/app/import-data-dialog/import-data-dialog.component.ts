import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CONFIRM_DIALOG_MODE, ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { SylvesterCollectionsDocument } from '../nelnet/sylvester-collection';
import { SylvesterApiService } from '../sylvester-api.service';
import { UtilsService } from '../utils.service';
import { Observable } from 'rxjs';

export enum IMPORT_MODE {
  NEW = 0,
  APPEND = 1,
  REPLACE = 2
}

interface keyField {
  name: string,
  selected: boolean
}

@Component({
  selector: 'app-import-data-dialog',
  templateUrl: './import-data-dialog.component.html',
  styleUrls: ['./import-data-dialog.component.scss']
})
export class ImportDataDialogComponent {
  ImportMode: any = IMPORT_MODE; // This is so we can use the ENUM in the HTML template
  importMode: IMPORT_MODE = IMPORT_MODE.NEW;

  selectedFileName: string | null = null;
  selectedTable: SylvesterCollectionsDocument | null = null;
  tableName: string = '';
  tableDescription: string = '';
  keyFields: keyField[] = [];

  target!: HTMLInputElement;
  fileHeaders: string[] = [];
  fileRows: string[][] = [];

  confirmationDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  fileSelectionComplete: boolean = false;
  step2Complete: boolean = false;
  validationComplete: boolean = false;
  importComplete: boolean = false;
  importMessage: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SylvesterCollectionsDocument[],
    private dialogRef: MatDialogRef<ImportDataDialogComponent>,
    private utils: UtilsService,
    private apiService: SylvesterApiService,
    private dialog: MatDialog
  ) {
    this.importMode = IMPORT_MODE.NEW;
  }

  disallowSpaces(event: KeyboardEvent): boolean {
    if (event.key === ' ') {
      return false;
    } else {
      return true;
    }
  }

  modeChanged(): void  {
    this.tableName = '';
    this.tableDescription = '';
    this.selectedTable = null;
    if (this.target) {
      this.target.value = '';
    }
  }

  selectedTableChanged(): void {
    if (this.selectedTable) {
      if (this.target) {
        this.target.value = '';
      }
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  done(): void {
    this.dialogRef.close(true);
  }

  readyToSelectFile(): boolean {
    if (this.importMode === IMPORT_MODE.NEW) {
      if (this.utils.ltrim(this.tableName) === '' || this.utils.ltrim(this.tableDescription) === '') {
        return false;
      }
    } else {
      if (this.selectedTable === null) {
        return false;
      }
    }

    return true;
  }

  fileSelected(event: Event) {
    this.fileSelectionComplete = true;
    this.target = event.target as HTMLInputElement;
    const file: File = (this.target.files as FileList)[0];

    let reader = new FileReader();
    var self = this; 

    reader.onload = function() {
      let errorMessage: string[] = [];
      const lines = (<string>reader.result).split(/\r\n|\n/);

      const allRows = self.utils.csv2arr((<string>reader.result));
      self.fileHeaders = allRows[0];
      self.fileRows = allRows.slice(1).filter(row => row.length === self.fileHeaders.length);

      self.keyFields = self.fileHeaders.map(header => {
        return {
          name: header,
          selected: false
        }
      })

      self.selectedFileName = file.name;
    }

    reader.readAsText(file);
  }

  resetReader(): void {
    this.selectedFileName = null;
    this.keyFields = [];
    if (this.target) {
      this.target.value = '';
    }
  }

  tableSelectionComplete(): boolean {
    if (this.importMode === IMPORT_MODE.NEW) {
      if (this.tableName.length === 0 || this.tableDescription.length === 0) {
        return false;
      }
    } else {
      if (!this.selectedTable) {
        return false;
      }
    }

    return true;
  }

  keyFieldSelectionChanged(): void {
    this.validationComplete = false;
  }

  readyToValidate(): boolean {
    if (this.keyFields.findIndex(field => field.selected) === -1) {
      return false;
    }

    return true;
  }

  validateFile(): Observable<boolean> {
    return new Observable(obs => {
      let fileOK = true;
  
      // Check for duplicate column names
      if (this.utils.checkForDuplicates(this.fileHeaders)) {
        this.displayErrorDialog('Duplicate Column Names', ['There are duplicate column names in the file.'])
        fileOK = false;
      }
  
      // Check for missing columns
      if (fileOK && this.importMode !== IMPORT_MODE.NEW) {
        // Check for column names in the file that to not exist in the selected table
        let invalidColumnErrors: string[] = [];
        for (let n = 0; n < this.fileHeaders.length; n++) {
          if (this.selectedTable?.fields.findIndex(field => field.name === this.fileHeaders[n]) === -1) {
            invalidColumnErrors.push(`The column "${this.fileHeaders[n]}" does not exist in the ${this.selectedTable.name} table`);
          }
        }
  
        // Check for column names in the selected table that do not exist in the file
        let missinColumnErrors: string[] = [];
        if (this.selectedTable) {
          for (let n = 0; n < this.selectedTable?.fields.length; n++) {
            if (this.fileHeaders.findIndex(header => header === this.selectedTable?.fields[n].name) === -1) {
              missinColumnErrors.push(`The column "${this.selectedTable?.fields[n].name}" is missing from the ${this.selectedFileName} file`);
            }
          }
        }
    
        if (invalidColumnErrors.length > 0 || missinColumnErrors.length > 0) {
          let errorMessage: string[] = [];
          if (invalidColumnErrors.length > 0) {
            errorMessage = invalidColumnErrors;
          }
  
          if (missinColumnErrors.length > 0) {
            if (errorMessage.length > 0) {
              errorMessage.push('--------------------');
              errorMessage = errorMessage.concat(missinColumnErrors);
            }
          }
  
          this.displayErrorDialog('Column Header Errors', errorMessage);
          fileOK = false;
        }
      }
      
      let testFields: {index: number, fieldName: string}[] = [];
  
      // Check for any rows in the file with null values in the key field(s)
      if (fileOK) {
        for (let fieldIndex = 0; fieldIndex < this.keyFields.length; fieldIndex++) {
          if (this.keyFields[fieldIndex].selected) {
            testFields.push({index: fieldIndex, fieldName: this.keyFields[fieldIndex].name});
          }
        }
  
        let nullKeyFields:number[] = [];
        for (let row = 0; row < this.fileRows.length; row++) {
          for (let fieldIndex = 0; fieldIndex < testFields.length; fieldIndex++) {
            if (this.fileRows[row][testFields[fieldIndex].index] === '') {
              nullKeyFields.push(row);
            }
          }
        }
  
        if (nullKeyFields.length > 0) {
          let nullKeyFieldErrors: string[] = ['The following records had null values in a key field:'];
          for (let n = 0; n < nullKeyFields.length; n++) {
            nullKeyFieldErrors.push(this.fileRows[n].toString());
          }
          this.displayErrorDialog('Null Key Fields in File', nullKeyFieldErrors);
          fileOK = false;
        }
      }
  
      // Check for duplicate rows in the file, based on the selected key field(s)
      if (fileOK) {
        let duplicates:number[] = []
  
        for (let rowIndex = 0; rowIndex < this.fileRows.length; rowIndex++) {
          for (let testRowIndex = rowIndex + 1; testRowIndex < this.fileRows.length; testRowIndex++) {
            let match = true;
            for (let testField = 0; testField < testFields.length; testField++) {
              const currentRow:any = this.fileRows[rowIndex];
              const testRow:any = this.fileRows[testRowIndex];
              if (currentRow[testFields[testField].index] !== testRow[testFields[testField].index]) {
                match = false;
                break;
              }
            }
  
            if (match) {
              duplicates.push(rowIndex + 1);
              break;
            }
          }
        }
  
        if (duplicates.length > 0) {
          let duplicateErrors: string[] = ['The following records were duplicated in the file:'];
          for (let n = 0; n < duplicates.length; n++) {
            duplicateErrors.push(this.fileRows[n].toString());
          }
          this.displayErrorDialog('Duplicate Rows in File', duplicateErrors);
          fileOK = false;
        }
      }
  
      // If we are appending, Check for duplicates in the existing table
      if (fileOK && this.importMode === IMPORT_MODE.APPEND && this.selectedTable) {
        let duplicateRows: number[] = [];
        this.apiService.getTable(this.selectedTable?.name).subscribe(table => {
          for (let fileIndex = 0; fileIndex < this.fileRows.length; fileIndex++) {
            for (let tableIndex = 0; tableIndex < table.rows.length; tableIndex++) {
              let match = true;
              for (let testFieldIndex = 0; testFieldIndex < testFields.length; testFieldIndex++) {
                const testField = testFields[testFieldIndex];
                if (table.rows[tableIndex][testField.fieldName] !== this.fileRows[fileIndex][testField.index]) {
                  match = false;
                  break;
                }
              }
  
              if (match) {
                if (duplicateRows.findIndex(row => row === fileIndex) === -1) {
                  duplicateRows.push(fileIndex);
                }
              }
            }
          }
  
          if (duplicateRows.length > 0) {
            let duplicateErrors: string[] = ['The following records already exist in the table:'];
            for (let n = 0; n < duplicateRows.length; n++) {
              duplicateErrors.push(this.fileRows[duplicateRows[n]].toString());
            }
            this.displayErrorDialog('Duplicates in Table', duplicateErrors);
            fileOK = false;
          } else {
            this.validationComplete = true;
            obs.next(true);
            obs.complete();
          }
        })
      } else {
        if (fileOK) {
          this.validationComplete = true;
          obs.next(true);
          obs.complete();
        }
      }
    })
  }

  import(): void {
    let importDocuments: any[] = [];

    for (let rowIndex = 0; rowIndex < this.fileRows.length; rowIndex++) {
      let doc:any = {};

      for (let fieldIndex = 0; fieldIndex < this.fileHeaders.length; fieldIndex++) {
        doc[this.fileHeaders[fieldIndex]] = this.fileRows[rowIndex][fieldIndex];
      }

      importDocuments.push(doc);
    }

    switch (this.importMode) {
      case IMPORT_MODE.NEW:
        break;
      case IMPORT_MODE.APPEND:
        if (this.selectedTable) {
          this.apiService.bulkInsert(this.selectedTable?.name, importDocuments).subscribe(resp => {
            if (resp.status === 'OK') {
              this.importComplete = true;

              this.importMessage = 'Import Complete!'
              if (resp.message) {
                this.importMessage += ' ' + resp.message;
              }
            } else {
              let errorMessage: string[] = ['There was an error inserting the new records into the database:'];
              if (resp.message) {
                errorMessage.push(resp.message);
              }
              this.displayErrorDialog('Error Uploading Data', errorMessage);
            }
          })
        }
        break;
      case IMPORT_MODE.REPLACE:
        if (this.selectedTable) {
          this.apiService.bulkReplace(this.selectedTable?.name, importDocuments).subscribe(resp => {
            if (resp.status === 'OK') {
              this.importComplete = true;

              this.importMessage = 'Import Complete!'
              if (resp.message) {
                this.importMessage += ' ' + resp.message;
              }
            } else {
              let errorMessage: string[] = ['There was an error replacing the table in the database:'];
              if (resp.message) {
                errorMessage.push(resp.message);
              }
              this.displayErrorDialog('Error Uploading Data', errorMessage);
            }
          })
        }
        break;
    }
  }

  displayErrorDialog(title: string, errorMessge: string[]): void {
    const dialogData = {
      mode: CONFIRM_DIALOG_MODE.OK,
      title: title,
      messageArray: errorMessge,
      messageCentered: false
    }
    this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
  }

}
