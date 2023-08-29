import { Component, Inject, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SylvesterUser } from '../../nelnet/sylvester-user';
import { SylvesterRole } from '../../nelnet/sylvester-role';
import { ObjectId } from 'mongodb';

export interface UserEditorDialogData {
  user: SylvesterUser,
  roles:SylvesterRole[]
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
  user!: SylvesterUser;
  originalSelectedRoles!: boolean[];
  selectedRoles!: RoleSelectionElement[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UserEditorDialogData,
    private dialogRef: MatDialogRef<UserEditorDialogComponent>,
    private dialog: MatDialog
    ) { }

  ngOnInit(): void {
    this.selectedRoles = [];
    this.originalSelectedRoles = [];
    this.data.roles.forEach(role => {
      const roleIndex = this.data.user.roleIDs.findIndex(roleID => roleID === role._id);
      let rse: RoleSelectionElement = {
        roleID: role._id,
        name: role.name,
        description: role.description,
        selected: roleIndex === -1 ? false : true
      }

      this.selectedRoles.push(rse);
      this.originalSelectedRoles.push(roleIndex === -1 ? false : true);
    })

    const userRoleIDs: ObjectId[] = [];
    this.data.user.roleIDs.forEach(roleID => {
      userRoleIDs.push(roleID);
    })

    this.user = {
      userID: this.data.user.userID,
      lastName: this.data.user.lastName,
      firstName: this.data.user.firstName,
      roleIDs: userRoleIDs
    }
  }

  canSave(): boolean {
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

    return false;
  }

  delete(): void {
    console.log();
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.user.roleIDs = this.selectedRoles.filter(role => role.selected).map(role => role.roleID);
    this.dialogRef.close(this.user);
  }
}
