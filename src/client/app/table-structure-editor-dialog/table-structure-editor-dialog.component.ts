import { Component, Inject, OnInit } from '@angular/core';

import { felixColumn } from '../nelnet/nelnet-table';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface TableStructureEditorDialogData {
  tableName: string,
  tableDescription: string,
  cols: felixColumn[]
}

@Component({
  selector: 'app-table-structure-editor-dialog',
  templateUrl: './table-structure-editor-dialog.component.html',
  styleUrls: ['./table-structure-editor-dialog.component.scss']
})
export class TableStructureEditorDialogComponent implements OnInit {
  cols!: felixColumn[];
  addMode: boolean = false;

  constructor (
    @Inject(MAT_DIALOG_DATA) public data: TableStructureEditorDialogData
    ) { }
  
  ngOnInit(): void {
    this.cols = this.data.cols;
  }

  addColumn(): void {
    //TODO Scroll to bottom when new column is added
    this.addMode = true;

    const newCol: felixColumn = {
      name: '',
      type: 'varchar'
    }

    this.cols.push(newCol);
  }

  removeColumnClicked(colName: string): void {
    if (colName === '') {
      this.removeColumn(colName);
    } else {
      //TODO Repalce this with a more robust dialog
      if (window.confirm(`Are you sure you want to delete the column "${colName}"?`)) {
        this.removeColumn(colName);
      }
    }
  }

  removeColumn(colName: string): void {
    const index = this.cols.findIndex(col => col.name === colName);
    if (index !== -1) {
      this.cols.splice(index, 1);
    } else {
      //TODO handle errors here more gracefully
      alert ('There was an error removing the selected column.');
    }
  }
  

  colDataChanged(): void {
    if (this.cols.find(col => col.name.length === 0)) {
      this.addMode = true;
    } else {
      this.addMode = false;
    }
  }
}
