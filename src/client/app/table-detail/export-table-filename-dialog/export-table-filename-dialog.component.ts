import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { UtilsService } from '../../utils.service';

@Component({
  selector: 'app-export-table-filename-dialog',
  templateUrl: './export-table-filename-dialog.component.html',
  styleUrls: ['./export-table-filename-dialog.component.scss']
})
export class ExportTableFilenameDialogComponent implements OnInit {
  allowedFieldNameCharacters: RegExp = this.utils.getAllowedFieldNameCharacters();

  constructor (
    @Inject(MAT_DIALOG_DATA) public fileName: string,
    private dialogRef: MatDialogRef<ExportTableFilenameDialogComponent>,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    // this.fileName = this.data;
  }

  keyFilter(event: KeyboardEvent): boolean {
    if (this.allowedFieldNameCharacters.test(event.key)) {
      return true;
    } else {
      return false;
    }
  }

  fileNameChanged(): void {
    this.fileName += '.csv';
  }

  save(): void {
    this.dialogRef.close(this.fileName);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
