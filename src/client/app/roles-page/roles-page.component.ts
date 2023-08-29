import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SylvesterApiService } from '../sylvester-api.service'
import { RoleEditorDialogComponent } from './role-editor-dialog/role-editor-dialog.component';
import { SylvesterRole } from '../nelnet/sylvester-role';
import { forkJoin } from 'rxjs';

interface RoleRow {
  role: SylvesterRole,
  collectionsString: string
}

@Component({
  selector: 'app-roles-page',
  templateUrl: './roles-page.component.html',
  styleUrls: ['./roles-page.component.scss']
})
export class RolesPageComponent implements OnInit {
  isLoading: boolean = false;
  roles!: RoleRow[];
  displayedColumns: string[] = ['name', 'description', 'collections'];
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
        let collections: string = '';
        role.collections.forEach(coll => {
          const collection = tablesData.find(table => table._id === coll.id);
          if (collection) {
            if (collections.length > 0) {
              collections += ', ';
            }

            collections += collection.name;
          }
        });

        const rr: RoleRow = {
          role: role,
          collectionsString: collections
        }

        this.roles.push(rr);
      })
      
      this.isLoading = false;
    })
  }

  addRole(): void {

  }

  rowClicked(index: number): void {
    this.roleEditorDialogRef = this.dialog.open(RoleEditorDialogComponent, {data: this.roles[index].role, disableClose: true});
    this.roleEditorDialogRef.afterClosed().subscribe(newRole => {
      if(newRole) {
        this.apiService.updateRole(newRole).subscribe(resp => {
          if (resp.status === 'OK') {
            this.getRoles();
            this.snackBar.open('Updated role saved', 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
          } else {
            alert(`There was an error saving the role record: ${resp.message}`);
          }
        })
      }
    })
  }
}
