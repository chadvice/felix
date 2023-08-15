import { Component, Inject } from '@angular/core';

import { felixColumn } from '../nelnet/nelnet-table';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface TableRowEditorDialogData {
  tableName: string,
  tableDescription: string,
  cols: felixColumn[],
  record: any
}

@Component({
  selector: 'app-table-row-editor-dialog',
  templateUrl: './table-row-editor-dialog.component.html',
  styleUrls: ['./table-row-editor-dialog.component.scss']
})
export class TableRowEditorDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TableRowEditorDialogData
    ) { }
}
