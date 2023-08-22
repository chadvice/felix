import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CONFIRM_DIALOG_MODE, ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { SylvesterCollectionsDocument } from '../nelnet/sylvester-collection';

@Component({
  selector: 'app-import-data-dialog',
  templateUrl: './import-data-dialog.component.html',
  styleUrls: ['./import-data-dialog.component.scss']
})
export class ImportDataDialogComponent {
  importMode: string = 'NEW';

  tableName!: string;
  tableDescription!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SylvesterCollectionsDocument[],
    private dialogRef: MatDialogRef<ImportDataDialogComponent>
  ) {}

  disallowSpaces(event: KeyboardEvent): boolean {
    if (event.key === ' ') {
      return false;
    } else {
      return true;
    }
  }

  selectedTableChanged(): void {
    
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
