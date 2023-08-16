import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export enum CONFIRM_DIALOG_MODE {
  OK = 0,
  YES_NO = 1,
  SAVE_CANCEL = 2,
  DELETE_CANCEL = 3,
  DISCARD_CANCEL = 4
}

export interface ConfirmationDialogData {
  mode: CONFIRM_DIALOG_MODE,
  title: string,
  message?: string,
  messageArray?: string[],
  messageCentered: boolean
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {
  ConfirmDialogMode: any = CONFIRM_DIALOG_MODE; // This is so we can use the ENUM in the HTML template
  constructor(
    private dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
    ) { }

  ngOnInit() {
  }

  closeDialog(confirm: boolean): void {
    this.dialogRef.close(confirm);
  }

}
