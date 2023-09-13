import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SylvesterApiService } from '../sylvester-api.service'
import { RoleEditorDialogComponent, RoleEditorResponse } from './role-editor-dialog/role-editor-dialog.component';
import { SylvesterRole } from '../nelnet/sylvester-role';
import { forkJoin } from 'rxjs';

interface RoleRow {
  role: SylvesterRole,
  tablesString: string
}

@Component({
  selector: 'app-roles-page',
  templateUrl: './roles-page.component.html',
  styleUrls: ['./roles-page.component.scss']
})
export class RolesPageComponent implements OnInit {
  isLoading: boolean = false;
  roles!: RoleRow[];
  displayedColumns: string[] = ['name', 'description', 'tables'];
  roleEditorDialogRef!: MatDialogRef<RoleEditorDialogComponent>;

  constructor (
    private apiService: SylvesterApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.getRoles();
  }

  getRoles(): void {
    this.isLoading = true;
    const rolesData = this.apiService.getRoles();
    const tablesData = this.apiService.getTables();
    forkJoin([rolesData, tablesData]).subscribe(([rolesData, tablesData]) => {
      this.roles = [];

      rolesData.forEach(role => {
        let tables: string = '';
        if (role.tablePermissions) {
          role.tablePermissions.forEach(coll => {
            const table = tablesData.find(table => table._id === coll.tableID);
            if (table) {
              if (tables.length > 0) {
                tables += ', ';
              }
  
              tables += table.name;
            }
          });
        }

        const rr: RoleRow = {
          role: role,
          tablesString: tables
        }

        this.roles.push(rr);
      })
      
      this.isLoading = false;
    })
  }

  addRole(): void {
    this.editRole();
  }

  rowClicked(index: number): void {
    this.editRole(this.roles[index].role);
  }

  editRole(role?: SylvesterRole): void {
    let theRole: SylvesterRole = {};
    if (role) {
      theRole = role;
    } 

    this.roleEditorDialogRef = this.dialog.open(RoleEditorDialogComponent, {data: theRole, disableClose: true});
    this.roleEditorDialogRef.afterClosed().subscribe(editorResp => {
      const dialogResp: RoleEditorResponse = editorResp;
      switch (dialogResp.status) {
        case 'save':
          if (dialogResp.role) {
            this.apiService.updateRole(dialogResp.role).subscribe(resp => {
              if (resp.status === 'OK') {
                this.getRoles();
                this.snackBar.open(`${dialogResp.role?.name} role saved`, 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
              } else {
                alert(`There was an error saving the role record: ${resp.message}`);
              }
            })  
          }
          break;
        case 'delete':
          if (dialogResp.role?._id) {
            this.apiService.deleteRole(dialogResp.role._id).subscribe(resp => {
              if (resp.status === 'OK') {
                this.getRoles();
                this.snackBar.open(`${dialogResp.role?.name} role deleted`, 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
              } else {
                alert(`There was an error deleting the role record: ${resp.message}`);
              }
            })
          }
          break;
        case 'cancel':
          break
      }
    })
  }
}
