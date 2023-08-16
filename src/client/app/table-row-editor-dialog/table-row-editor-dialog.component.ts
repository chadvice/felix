import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SylvesterDocumentField } from '../nelnet/sylvester-collection';

export interface TableRowEditorDialogData {
  tableName: string,
  tableDescription: string,
  cols: SylvesterDocumentField[],
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
