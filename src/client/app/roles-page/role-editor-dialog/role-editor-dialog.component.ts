import { Component, Inject, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SylvesterApiService } from '../../sylvester-api.service'
import { SylvesterRole, SylvesterTablePermission } from '../../nelnet/sylvester-role';
import { ConfirmationDialogComponent, CONFIRM_DIALOG_MODE } from '../../confirmation-dialog/confirmation-dialog.component';
import { ObjectId } from 'mongodb';
import { SylvesterUser } from '../../nelnet/sylvester-user';

export interface RoleEditorResponse {
  status: string,
  role?: SylvesterRole
}

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
  confirmationDialogRef!: MatDialogRef<ConfirmationDialogComponent>;
  name: string = '';
  description?: string = '';
  displayedColumns: string[] = ['selected', 'name', 'description', 'canEdit'];
  users!: SylvesterUser[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SylvesterRole,
    private dialogRef: MatDialogRef<RoleEditorDialogComponent>,
    private apiService: SylvesterApiService,
    private dialog: MatDialog
    ) { }
  
  ngOnInit(): void {
    this.name = this.data.name ? this.data.name : '';
    this.description = this.data.description;
    this.loadData();
    if (this.data._id) {
      this.loadUsers();
    }
  }

  loadData(): void {
    this.isLoading = true;
    this.apiService.getTables().subscribe(tables => {
      this.originalSelectedCollections = [];
      this.selectedCollections = [];
      tables.forEach(table => {

        let collIndex = -1;
        if (this.data.tablePermissions) {
          collIndex = this.data.tablePermissions.findIndex(coll => coll.tableID === table._id);
        }

        let canEdit: boolean = false;
        if (collIndex !== -1 && this.data.tablePermissions) {
          canEdit = this.data.tablePermissions[collIndex].canEdit;
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

  loadUsers(): void {
    this.apiService.getUsers().subscribe(users => {
      this.users = users;
    })
  }

  checkIfCanDelete(): boolean {
    for (let n = 0; n < this.users.length; n++) {
      if (this.users[n].roleIDs) {
        if (this.users[n].roleIDs?.findIndex(roleID => roleID === this.data._id) !== -1) {
          return false;
        }
      }
    }

    return true;
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
    if (!this.checkIfCanDelete()) {
      const dialogData = {
        mode: CONFIRM_DIALOG_MODE.OK,
        title: 'Role in Use',
        messageArray: ['This role is in user by one or more users.', 'Please remove the role from all users before deleting it.'],
        messageCentered: true
      }
      this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
    } else {
      const dialogData = {
        mode: CONFIRM_DIALOG_MODE.DELETE_CANCEL,
        title: 'Delete Role',
        messageArray: ['You are about to permanently DELETE this role.', 'This action can not be undone.', 'Are you sure you want continue?'],
        messageCentered: true
      }
      this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
      this.confirmationDialogRef.afterClosed().subscribe(dialogResp => {
        if (dialogResp) {
          const resp: RoleEditorResponse = {
            status: 'delete',
            role: this.data
          }
  
          this.dialogRef.close(resp);
        }
      })
    }
  }

  cancel(): void {
    const resp: RoleEditorResponse = {
      status: 'cancel'
    }

    this.dialogRef.close(resp);
  }

  save(): void {
    const tablePermissions: SylvesterTablePermission[] = this.selectedCollections.filter(coll => coll.selected).map(coll => {
      return {
        tableID: coll.id,
        canEdit: coll.canEdit
      }
    })

    const updatedRole: SylvesterRole = {
      _id: this.data._id,
      name: this.name,
      description: this.description,
      tablePermissions: tablePermissions
    }

    const resp: RoleEditorResponse = {
      status: 'save',
      role: updatedRole
    }
    
    this.dialogRef.close(resp);
  }
}
