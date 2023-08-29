import { Component, Inject, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SylvesterApiService } from '../../sylvester-api.service'
import { SylvesterRole, SylvesterRoleCollectionElement } from '../../nelnet/sylvester-role';
import { ObjectId } from 'mongodb';

interface CollectionSelectionElement {
  id: ObjectId,
  selected: boolean,
  name: string,
  description: string,
  canEdit: boolean
}

@Component({
  selector: 'app-role-editor-dialog',
  templateUrl: './role-editor-dialog.component.html',
  styleUrls: ['./role-editor-dialog.component.scss']
})
export class RoleEditorDialogComponent implements OnInit {
  isLoading: boolean = false;
  originalSelectedCollections!: CollectionSelectionElement[];
  selectedCollections!: CollectionSelectionElement[];
  name: string = '';
  description?: string = '';
  displayedColumns: string[] = ['selected', 'name', 'description', 'canEdit'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SylvesterRole,
    private dialogRef: MatDialogRef<RoleEditorDialogComponent>,
    private apiService: SylvesterApiService,
    ) { }
  
  ngOnInit(): void {
    this.name = this.data.name;
    this.description = this.data.description;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.apiService.getTables().subscribe(tables => {
      this.originalSelectedCollections = [];
      this.selectedCollections = [];
      tables.forEach(table => {

        const collIndex = this.data.collections.findIndex(coll => coll.id === table._id);
        let canEdit: boolean = false;
        if (collIndex !== -1) {
          canEdit = this.data.collections[collIndex].canEdit;
        }

        const cse: CollectionSelectionElement = {
          id: table._id,
          selected: collIndex === -1 ? false : true,
          name: table.name,
          description: table.description,
          canEdit: canEdit
        }

        const ocse: CollectionSelectionElement = {
          id: table._id,
          selected: collIndex === -1 ? false : true,
          name: table.name,
          description: table.description,
          canEdit: canEdit
        }

        this.selectedCollections.push(cse);
        this.originalSelectedCollections.push(ocse);
      })

      this.isLoading = false;
    })
  }

  canSave(): boolean {
    if (this.name.length === 0) {
      return false;
    }

    if (this.name !== this.data.name) {
      return true;
    }

    if (this.description !== this.data.description) {
      return true;
    }

    if (this.selectedCollections && this.selectedCollections.length > 0) {
      for (let n = 0; n < this.selectedCollections.length; n++) {
        if (
          this.selectedCollections[n].selected !== this.originalSelectedCollections[n].selected ||
          this.selectedCollections[n].canEdit !== this.originalSelectedCollections[n].canEdit
          ) {
            return true;
          }
      }
    }

    return false;
  }

  delete(): void {
    console.log();
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    const collections: SylvesterRoleCollectionElement[] = this.selectedCollections.filter(coll => coll.selected).map(coll => {
      return {
        id: coll.id,
        canEdit: coll.canEdit
      }
    })

    const updatedRole: SylvesterRole = {
      _id: this.data._id,
      name: this.name,
      description: this.description,
      collections: collections
    }

    this.dialogRef.close(updatedRole);
  }
}
