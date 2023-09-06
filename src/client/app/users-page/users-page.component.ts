import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SylvesterApiService } from '../sylvester-api.service';
import { UtilsService } from '../utils.service';
import { SylvesterUser } from '../nelnet/sylvester-user';
import { SylvesterRole } from '../nelnet/sylvester-role';
import { UserEditorDialogComponent, UserEditorDialogData, UserEditorDialogResponse } from './user-editor-dialog/user-editor-dialog.component';

interface UserRow {
  user: SylvesterUser,
  roles: string
}

@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.scss']
})
export class UsersPageComponent implements OnInit {
  isLoading: boolean = false;
  users!: UserRow[];
  sortedUsers!: UserRow[];
  currentSort: Sort = {active: '', direction: ''};
  roles!: SylvesterRole[];
  userEditorDialogRef!: MatDialogRef<UserEditorDialogComponent>;

  
  displayedColumns: string[] = ['userID', 'lastName', 'firstName', 'roles', 'canImport', 'canExport', 'canCreateTable', 'canDeleteTable', 'canAlterTable', 'canViewAuditLogs', 'canEditUsers', 'canEditRoles'];

  constructor (
    private apiService: SylvesterApiService,
    private utils: UtilsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const lsUsersSortActive = localStorage.getItem('SylvesterUsersSortActive');
    const lsUsersSortDirection = localStorage.getItem('SylvesterUsersSortDirection');
    if (lsUsersSortActive && lsUsersSortDirection) {
      this.currentSort.active = lsUsersSortActive;
      this.currentSort.direction = localStorage.getItem('SylvesterUsersSortDirection') === 'asc' ? 'asc' : 'desc';
    }
    this.getUsers();
  }

  getUsers(): void {
    this.isLoading = true;

    const users = this.apiService.getUsers();
    const roles = this.apiService.getRoles();
    forkJoin([users, roles]).subscribe(([users, roles]) => {
      this.roles = roles;
      this.users = [];
      users.forEach(user => {
        let roleList: string = '';
        
        user.roleIDs?.forEach(roleID => {
          const role = roles.find(role => role._id === roleID);
          if (role) {
            if (roleList.length > 0) {
              roleList += ', ';
            }
            roleList += role.name;
          }
        })

        const userRow: UserRow = {
          user: user,
          roles: roleList
        }

        this.users.push(userRow);
      })

      this.sortUsers(this.currentSort);


      this.isLoading = false;
    })
    
  }

  sortUsers(sort: Sort): void {
    this.sortedUsers = this.users.sort((a, b) => {
      return this.utils.compare(a.user.lastName, b.user.lastName, true);
    })
    //////////////////////////////////
    this.currentSort = sort;
    localStorage.setItem('SylvesterUsersSortActive', this.currentSort.active);
    localStorage.setItem('SylvesterUsersSortDirection', this.currentSort.direction);

    const data = this.users.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedUsers = data;
      return;
    }

    this.sortedUsers = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'userName': return this.utils.compare(a.user.userID, b.user.userID, isAsc);
        case 'lastName': return this.utils.compare(a.user.lastName, b.user.lastName, isAsc);
        case 'firstName': return this.utils.compare(a.user.firstName, b.user.firstName, isAsc);
        default: return 0;
      }
    });
  }

  rowClicked(index: number): void {
    this.editUser(false, this.roles, this.sortedUsers[index].user);
  }

  addUser(): void {
    this.editUser(true, this.roles);
  }

  editUser(newUser: boolean, roles: SylvesterRole[], user?: SylvesterUser): void {
    let userIDs: string[] = [];
    this.sortedUsers.forEach(user => {
      if (user.user.userID) {
        userIDs.push(user.user.userID);
      }
    })
    
    const dialogData: UserEditorDialogData = {
      newUser: newUser,
      user: user ? user : {},
      roles: roles ? roles : [],
      userIDs: userIDs
    }

    this.userEditorDialogRef = this.dialog.open(UserEditorDialogComponent, {data: dialogData, disableClose: true});
    this.userEditorDialogRef.afterClosed().subscribe(dialogResp => {
      const userDialogResp: UserEditorDialogResponse = dialogResp;

      switch (userDialogResp.status) {
        case 'save':
          if (userDialogResp.user) {
            this.apiService.updateUser(userDialogResp.user).subscribe(resp => {
              if (resp.status === 'OK') {
                this.getUsers();
                this.snackBar.open('User record saved', 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
              } else {
                alert(`There was an error saving the user record: ${resp.message}`);
              }
            })
          }
          break;
        case 'delete':
          if (userDialogResp.user && userDialogResp.user.userID) {
            this.apiService.deleteUser(userDialogResp.user.userID).subscribe(resp => {
              if (resp.status === 'OK') {
                this.getUsers();
                this.snackBar.open('User record deleted', 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
              } else {
                alert(`There was an error deleting the user record: ${resp.message}`);
              }
            })
          }
          break;
        case 'cancel':
          break;
      }
    })
  }

  getPermissionIcon(enabled: boolean): string {
    if (enabled) {
      return 'radio_button_checked';
    } else {
      return 'radio_button_unchecked'
    }
  }
}
