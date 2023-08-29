import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SylvesterApiService } from '../sylvester-api.service'
import { UtilsService } from '../utils.service';
import { SylvesterUser } from '../nelnet/sylvester-user';
import { SylvesterRole } from '../nelnet/sylvester-role';
import { UserEditorDialogComponent, UserEditorDialogData } from './user-editor-dialog/user-editor-dialog.component';

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
  sortedUsers!: UserRow[];
  roles!: SylvesterRole[];
  userEditorDialogRef!: MatDialogRef<UserEditorDialogComponent>;
  displayedColumns: string[] = ['userID', 'lastName', 'firstName', 'roles'];

  constructor (
    private apiService: SylvesterApiService,
    private utils: UtilsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.isLoading = true;

    const users = this.apiService.getUsers();
    const roles = this.apiService.getRoles();
    forkJoin([users, roles]).subscribe(([users, roles]) => {
      this.roles = roles;
      let userRows: UserRow[] = [];
      users.forEach(user => {
        let roleList: string = '';
        
        user.roleIDs.forEach(roleID => {
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

        userRows.push(userRow);
      })

      this.sortedUsers = userRows.sort((a, b) => {
        return this.utils.compare(a.user.userID, b.user.userID, true);
      })

      this.isLoading = false;
    })
    
  }

  rowClicked(index: number): void {
    const dialogData: UserEditorDialogData = {
      user: this.sortedUsers[index].user,
      roles: this.roles
    }

    this.userEditorDialogRef = this.dialog.open(UserEditorDialogComponent, {data: dialogData, disableClose: true});
    this.userEditorDialogRef.afterClosed().subscribe(user => {
      if (user) {
        this.apiService.updateUser(user).subscribe(resp => {
          if (resp.status === 'OK') {
            this.getUsers();
            this.snackBar.open('User record saved', 'OK', { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 1500 });
          } else {
            alert(`There was an error saving the user record: ${resp.message}`);
          }
        })
      }
    })
  }

  addUser(): void {

  }
}
