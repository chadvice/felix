import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CONFIRM_DIALOG_MODE, ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { SylvesterCollectionsDocument } from '../nelnet/sylvester-collection';
import { UtilsService } from '../utils.service';

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SylvesterCollectionsDocument[],
    private dialogRef: MatDialogRef<ImportDataDialogComponent>,
    private utils: UtilsService,
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

      //TODO: return here, and deal with the validation in the main code, then force the user to re-load the file if anything is wrong

      // const headers = (lines[0]).split(',');
      // for (let n = 0; n < headers.length; n++) {
      //   headers[n] = headers[n].replace(/"/g, '');
      //   const invalidChars = headers[n].match(/[^A-Za-z0-9_-]/g);
      //   if (invalidChars?.length && invalidChars.length > 0) {
      //     errorMessage.push(`Column header \"${headers[n]}\" has the following invalid characters: \"${invalidChars}\"`);
      //   }
      // }

      // if (errorMessage.length > 0) {
      //   self.displayErrorDialog('Invlaid Characters in Column Names', errorMessage);
      //   self.resetReader();
      //   return;
      // }

      // const idIndex = headers.findIndex(header => header === '_id');
      // if (idIndex !== -1) {
      //   headers.splice(idIndex, 1);
      // }

      // if (self.importMode === IMPORT_MODE.NEW) {
      //   if (self.utils.checkForDuplicates(headers)) {
      //     self.displayErrorDialog('Duplicate Column Names', ['One or more of the specified column names appears more than once.'])

      //     self.resetReader();
      //     return;
      //   }
      //   self.keyFields = headers.map(header => {
      //     return {
      //       name: header,
      //       selected: false
      //     }
      //   })
      // } else {
      //   for (let n = 0; n < headers.length; n++) {
      //     if (self.selectedTable?.fields.findIndex(field => field.name === headers[n]) === -1) {
      //       errorMessage.push(`The column "${headers[n]}" does not exist in the ${self.selectedTable.name} table`);
      //     }
      //   }

      //   if (errorMessage.length > 0) {
      //     self.displayErrorDialog('Invalid Column Names', errorMessage);
      //     self.resetReader();
      //     return;
      //   }
      // }

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

  validateFile(): void {
    let fileOK = true;

    // Check for duplicate column names
    if (this.utils.checkForDuplicates(this.fileHeaders)) {
      this.displayErrorDialog('Duplicate Column Names', ['There are duplicate column names in the file.'])
      fileOK = false;
    }

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
    
    let testFieldIndexes: number[] = [];

    if (fileOK) {
      for (let fieldIndex = 0; fieldIndex < this.keyFields.length; fieldIndex++) {
        if (this.keyFields[fieldIndex].selected) {
          testFieldIndexes.push(fieldIndex);
        }
      }

      // Check for any rows in the file with null values in the key field(s)
      let nullKeyFields:number[] = [];
      for (let row = 0; row < this.fileRows.length; row++) {
        for (let fieldIndex = 0; fieldIndex < testFieldIndexes.length; fieldIndex++) {
          if (this.fileRows[row][testFieldIndexes[fieldIndex]] === '') {
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

    if (fileOK) {
      // Check for duplicate rows in the file, based on the selected key field(s)
      let duplicates:number[] = []

      for (let rowIndex = 0; rowIndex < this.fileRows.length; rowIndex++) {
        for (let testRowIndex = rowIndex + 1; testRowIndex < this.fileRows.length; testRowIndex++) {
          let match = true;
          for (let testField = 0; testField < testFieldIndexes.length; testField++) {
            const currentRow:any = this.fileRows[rowIndex];
            const testRow:any = this.fileRows[testRowIndex];
            if (currentRow[testFieldIndexes[testField]] !== testRow[testFieldIndexes[testField]]) {
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

    if (fileOK) {
      this.validationComplete = true;
    }
  }

  validate(): void {
    if (this.importMode === IMPORT_MODE.NEW) {
      
    }
  }

  readyToImport(): boolean {
    /*
    - for NEW:
      - no duplicate column names
      - column names all meet requirements
    - for ADD / REPLACE:
      - column names match existing table
    
    - after load:
      - 
    */
   return false;
  }

  import(): void {

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
