import { Component, Inject, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent, CONFIRM_DIALOG_MODE } from '../../confirmation-dialog/confirmation-dialog.component';
import { SylvesterUser } from '../../nelnet/sylvester-user';
import { SylvesterRole } from '../../nelnet/sylvester-role';
import { ObjectId } from 'mongodb';

export interface UserEditorDialogData {
  newUser: boolean,
  user: SylvesterUser,
  roles:SylvesterRole[],
  userIDs: string[]
}

export interface UserEditorDialogResponse {
  status: string,
  user?: SylvesterUser
}

interface RoleSelectionElement {
  roleID: ObjectId,
  name: string,
  description?: string,
  selected: boolean
}

@Component({
  selector: 'app-user-editor-dialog',
  templateUrl: './user-editor-dialog.component.html',
  styleUrls: ['./user-editor-dialog.component.scss']
})
export class UserEditorDialogComponent implements OnInit {
  newUser!: boolean;
  user!: SylvesterUser;
  originalSelectedRoles!: boolean[];
  selectedRoles!: RoleSelectionElement[];
  confirmationDialogRef!: MatDialogRef<ConfirmationDialogComponent>;
  errorMessage: string = '';
  userIDValid: boolean = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UserEditorDialogData,
    private dialogRef: MatDialogRef<UserEditorDialogComponent>,
    private dialog: MatDialog
    ) { }

  ngOnInit(): void {
    this.newUser = this.data.newUser;
    this.selectedRoles = [];
    this.originalSelectedRoles = [];
    this.data.roles.forEach(role => {
      let roleIndex = -1;
      if (this.data.user.roleIDs && this.data.user.roleIDs.length > 0) {
        roleIndex = this.data.user.roleIDs.findIndex(roleID => roleID === role._id);
      }

      if (role._id && role.name) {
        let rse: RoleSelectionElement = {
          roleID: role._id,
          name: role.name,
          description: role.description,
          selected: roleIndex === -1 ? false : true
        }
        
        this.selectedRoles.push(rse);
        this.originalSelectedRoles.push(roleIndex === -1 ? false : true);
      }

    })

    const userRoleIDs: ObjectId[] = [];
    this.data.user.roleIDs?.forEach(roleID => {
      userRoleIDs.push(roleID);
    })

    this.user = {
      userID: this.data.user.userID,
      lastName: this.data.user.lastName,
      firstName: this.data.user.firstName,
      roleIDs: userRoleIDs,
      canImport: this.data.user.canImport,
      canExport: this.data.user.canExport,
      canCreateTable: this.data.user.canCreateTable,
      canDeleteTable: this.data.user.canDeleteTable,
      canViewAuditLogs: this.data.user.canViewAuditLogs,
      canEditUsers: this.data.user.canEditUsers,
      canEditRoles: this.data.user.canEditRoles
    }

    if (this.newUser) {
      this.user.canImport = false;
      this.user.canExport = false;
      this.user.canCreateTable = false;
      this.user.canDeleteTable = false;
      this.user.canViewAuditLogs = false;
      this.user.canEditUsers = false;
      this.user.canEditRoles = false;
    }
  }

  userIDChanged(): void {
    if (this.data.userIDs.findIndex(userID => userID === this.user.userID) !== -1) {
      this.errorMessage = 'UserID is already in use';
      this.userIDValid = false;
    } else {
      this.errorMessage = '';
      this.userIDValid = true;
    }
  }

  canSave(): boolean {
    if (!this.userIDValid) {
      return false;
    }

    if (!this.user.userID || this.user.userID.length === 0) {
      return false;
    }

    if (this.user.lastName?.length === 0) {
      return false;
    }

    if (this.user.firstName?.length === 0) {
      return false;
    }

    if (this.user.lastName !== this.data.user.lastName) {
      return true;
    }

    if (this.user.firstName !== this.data.user.firstName) {
      return true;
    }

    for (let n = 0; n < this.selectedRoles.length; n++) {
      if (this.selectedRoles[n].selected !== this.originalSelectedRoles[n]) {
        return true;
      }
    }

    if (this.user.canImport !== this.data.user.canImport) {
      return true;
    }

    if (this.user.canExport !== this.data.user.canExport) {
      return true;
    }

    if (this.user.canCreateTable !== this.data.user.canCreateTable) {
      return true;
    }

    if (this.user.canDeleteTable !== this.data.user.canDeleteTable) {
      return true;
    }

    if (this.user.canViewAuditLogs !== this.data.user.canViewAuditLogs) {
      return true;
    }

    if (this.user.canEditUsers !== this.data.user.canEditUsers) {
      return true;
    }

    if (this.user.canEditRoles !== this.data.user.canEditRoles) {
      return true;
    }

    return false;
  }

  delete(): void {
    const dialogData = {
      mode: CONFIRM_DIALOG_MODE.DELETE_CANCEL,
      title: 'Delete User',
      messageArray: ['You are about to permanently DELETE this user.', 'This action can not be undone.', 'Are you sure you want continue?'],
      messageCentered: true
    }
    this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {data: dialogData});
    this.confirmationDialogRef.afterClosed().subscribe(dialogResp => {
      if (dialogResp) {
        const resp: UserEditorDialogResponse = {
          status: 'delete',
          user: this.user
        }

        this.dialogRef.close(resp);
      }
    })
  }

  cancel(): void {
    const resp: UserEditorDialogResponse = {
      status: 'cancel'
    }

    this.dialogRef.close(resp);
  }

  save(): void {
    this.user.roleIDs = this.selectedRoles.filter(role => role.selected).map(role => role.roleID);
    const resp: UserEditorDialogResponse = {
      status: 'save',
      user: this.user
    }

    this.dialogRef.close(resp);
  }
}
