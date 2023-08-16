import { Component, Inject, ViewChild } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SylvesterDocumentField } from '../nelnet/sylvester-collection';
import { ConfirmationDialogComponent, CONFIRM_DIALOG_MODE } from '../confirmation-dialog/confirmation-dialog.component';

export interface TableRowEditorDialogData {
  tableName: string,
  tableDescription: string,
  cols: SylvesterDocumentField[],
  record: any,
  new: boolean
}

@Component({
  selector: 'app-table-row-editor-dialog',
  templateUrl: './table-row-editor-dialog.component.html',
  styleUrls: ['./table-row-editor-dialog.component.scss']
})
export class TableRowEditorDialogComponent {
  @ViewChild('dataForm') dataForm: any;
  confirmationDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TableRowEditorDialogData,
    private dialogRef: MatDialogRef<TableRowEditorDialogComponent>,
    private dialog: MatDialog
    ) { }

    cancel(): void {
      if (this.dataForm.dirty) {
        const dialogData = {
          mode: CONFIRM_DIALOG_MODE.DISCARD_CANCEL,
          title: 'Discard Changes?',
          messageArray: ['Do you want to disacard any changes you have made?'],
          messageCentered: true
        }
        this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
        this.confirmationDialogRef.afterClosed().subscribe(discard => {
          if (discard) {
            this.dialogRef.close(null);
          }
        })
      } else {
        this.dialogRef.close(null);
      }
    }

    documentIsEmpty(): boolean {
      for (let i = 0; i < this.data.cols.length; i++) {
        if (Object.hasOwn(this.data.record, this.data.cols[i].name) && this.data.record[this.data.cols[i].name]?.length !== 0) {
          return false;
        }
      }

      return true;
    }
}
