import { Component, Inject, OnInit } from '@angular/core';

import { column } from '../nelnet/nelnet-table';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface TableRowEditorDialogData {
  tableName: string,
  tableDescription: string,
  cols: column[],
  record: any
}

@Component({
  selector: 'app-table-row-editor-dialog',
  templateUrl: './table-row-editor-dialog.component.html',
  styleUrls: ['./table-row-editor-dialog.component.scss']
})
export class TableRowEditorDialogComponent implements OnInit {
  // fieldNames!: string[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TableRowEditorDialogData) { }

    ngOnInit(): void {
      // this.fieldNames = Object.keys(this.data);
      // this.fieldNames = this.data.cols.map(col => col.name);
      console.log();
    }
}
