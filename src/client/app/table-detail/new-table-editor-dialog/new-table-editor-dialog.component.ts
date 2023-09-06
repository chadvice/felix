import { Component, OnInit } from '@angular/core';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SylvesterApiService } from '../../sylvester-api.service';
import { UtilsService } from '../../utils.service';
import { SylvesterCollectionsDocument, SylvesterDocumentField } from '../../nelnet/sylvester-collection';

@Component({
  selector: 'app-new-table-editor-dialog',
  templateUrl: './new-table-editor-dialog.component.html',
  styleUrls: ['./new-table-editor-dialog.component.scss']
})
export class NewTableEditorDialogComponent implements OnInit {
  table!: SylvesterCollectionsDocument;
  allowedFieldNameCharacters: RegExp = this.utils.getAllowedFieldNameCharacters();
  tableNames!: string[];
  errorMessage: string = '';

  constructor (
    private dialogRef: MatDialogRef<NewTableEditorDialogComponent>,
    private dialog: MatDialog,
    private utils: UtilsService,
    private apiService: SylvesterApiService
    ) { }

  ngOnInit(): void {
    this.getTables();
    this.initialzeTable();
  }

  getTables(): void {
    this.apiService.getTableNames().subscribe(tableNames => {
      this.tableNames = tableNames;
    });
  }

  initialzeTable(): void {
    this.table = {
      created: new Date(),
      name: '',
      description: '',
      fields: []
    }
  }

  keyFilter(event: KeyboardEvent): boolean {
    if (this.allowedFieldNameCharacters.test(event.key)) {
      return true;
    } else {
      return false;
    }
  }

  removeFieldClicked(index: number) {
    this.table.fields.splice(index, 1);
  }

  addField(): void {
    const field: SylvesterDocumentField = {
      name: '',
      type: 'string'
    }

    this.table.fields.push(field);
  }

  tableNameChanged(): void {
    this.errorMessage = '';
    if (this.table.name.length > 0 && this.tableNames.findIndex(tableName => tableName.toLowerCase() === this.table.name.toLowerCase()) !== -1) {
      this.errorMessage = `ERROR: Table name "${this.table.name}" is already in use.`
    }
  }

  formContainsEmptyFields(): boolean {
    if (this.utils.ltrim(this.table.description) === '') {
      return true;
    }

    if (this.utils.ltrim(this.table.name) === '') {
      return true;
    }

    for (let n = 0; n < this.table.fields.length; n++) {
      if (this.utils.ltrim(this.table.fields[n].name) === '') {
        return true;
      }
    }

    return false;
  }

  formContainsDuplicateFields(): boolean {
    return this.utils.checkForDuplicates(
      this.table.fields.map(field => this.utils.ltrim(field.name))
      );
  }

  canSave(): boolean {
    if (this.formContainsEmptyFields()) {
      return false;
    }
    
    if (this.formContainsDuplicateFields()) {
      return false;
    }
    
    if (this.table.fields.length === 0) {
      return false;
    }

    if (this.errorMessage.length > 0) {
      return false;
    }

    return true;
  }

  save(): void {
    this.dialogRef.close(this.table);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
