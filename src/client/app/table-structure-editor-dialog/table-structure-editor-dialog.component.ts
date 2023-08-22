import { Component, Inject, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CONFIRM_DIALOG_MODE, ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { SylvesterDocumentField } from '../nelnet/sylvester-collection';
import { UtilsService } from '../utils.service';

export interface TableStructureEditorDialogData {
  tableName: string,
  tableDescription: string,
  fields: SylvesterDocumentField[]
}

export interface TableStructureEditorField {
  oldName: string,
  newName: string,
  added: boolean,
  removed: boolean
}

export interface CollectionChanges {
  newDescription: string | null,
  fieldChanges: TableStructureEditorField[]
}

@Component({
  selector: 'app-table-structure-editor-dialog',
  templateUrl: './table-structure-editor-dialog.component.html',
  styleUrls: ['./table-structure-editor-dialog.component.scss']
})
export class TableStructureEditorDialogComponent implements OnInit {
  newDescription!: string;
  fields!: TableStructureEditorField[];
  confirmationDialogRef!: MatDialogRef<ConfirmationDialogComponent>;

  constructor (
    @Inject(MAT_DIALOG_DATA) public data: TableStructureEditorDialogData,
    private dialogRef: MatDialogRef<TableStructureEditorDialogComponent>,
    private dialog: MatDialog,
    private utils: UtilsService
    ) { }
  
  ngOnInit(): void {
    this.newDescription = this.data.tableDescription;

    this.fields = this.data.fields.map(field => {
      const tseField: TableStructureEditorField = {
        oldName: field.name,
        newName: field.name,
        added: false,
        removed: false
      }

      return tseField;
    })
  }

  addField(): void {
    //TODO Scroll to bottom when new field is added
    const newCol: TableStructureEditorField = {
      oldName: '',
      newName: '',
      added: true,
      removed: false
    }

    this.fields.push(newCol);
  }

  removeFieldClicked(colName: string): void {
    if (colName === '') {
      this.removeField(colName);
    } else {
      const dialogData = {
        mode: CONFIRM_DIALOG_MODE.YES_NO,
        title: 'Remove Field?',
        messageArray: ['Are you sure you want to remove this field?'],
        messageCentered: true
      }
      this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
      this.confirmationDialogRef.afterClosed().subscribe(resp => {
        if (resp) {
          this.removeField(colName);
        }
      })
    }
  }

  removeField(colName: string): void {
    const index = this.fields.findIndex(col => col.newName === colName);

    if (index !== -1) {
      if (this.fields[index].added) {
        this.fields.splice(index, 1);
      } else {
        this.fields[index].removed = true;
      }
    } else {
      //TODO handle errors here more gracefully
      alert ('There was an error removing the selected column.');
    }
  }

  formContainsEmptyFields(): boolean {
    if (this.utils.ltrim(this.newDescription) === '') {
      return true;
    }

    for (let n = 0; n < this.fields.length; n++) {
      if (this.utils.ltrim(this.fields[n].newName) === '') {
        return true;
      }
    }

    return false;
  }

  formContainsDuplicateFields(): boolean {
    return this.utils.checkForDuplicates(
      this.fields
      .filter(field => !field.removed)
      .map(field => this.utils.ltrim(field.newName))
      );
  }

  save(): void {
    this.dialogRef.close(this.getChanges());
  }

  cancel(): void {
    if (this.didAnythingChange()) {
      const dialogData = {
        mode: CONFIRM_DIALOG_MODE.DISCARD_CANCEL,
        title: 'Discard Changes?',
        messageArray: ['You have unsaved changes.', 'Are you sure you want to discard them?'],
        messageCentered: true
      }
      this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
      this.confirmationDialogRef.afterClosed().subscribe(resp => {
        if (resp) {
          this.dialogRef.close(null);
        }
      })
    } else {
      this.dialogRef.close(null);
    }
  }

  disallowSpaces(event: KeyboardEvent): boolean {
    if (event.key === ' ') {
      return false;
    } else {
      return true;
    }
  }

  getChanges(): CollectionChanges {
    let changes: CollectionChanges = {
      newDescription: null,
      fieldChanges: []
    };

    if (this.utils.ltrim(this.newDescription) !== this.utils.ltrim(this.data.tableDescription)) {
      changes.newDescription = this.newDescription;
    }
    const fieldChanges = this.fields.filter(field => (field.removed || field.added || field.oldName !== field.newName))
    if (fieldChanges.length > 0) {
      changes.fieldChanges = fieldChanges;
    }

    return changes;
  }

  didAnythingChange(): boolean {
    const changes = this.getChanges();

    if (changes.newDescription || changes.fieldChanges.length > 0) {
      return true;
    } else {
      return false;
    }
  }
}
