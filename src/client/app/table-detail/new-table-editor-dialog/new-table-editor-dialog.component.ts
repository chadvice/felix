import { Component, OnInit } from '@angular/core';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CONFIRM_DIALOG_MODE, ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
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

  constructor (
    private dialogRef: MatDialogRef<NewTableEditorDialogComponent>,
    private dialog: MatDialog,
    private utils: UtilsService
    ) { }

  ngOnInit(): void {
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

  save(): void {
    this.dialogRef.close(this.table);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
