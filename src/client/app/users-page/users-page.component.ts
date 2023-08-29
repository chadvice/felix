import { Component, OnInit } from '@angular/core';

import { SylvesterApiService } from '../sylvester-api.service'
import { UtilsService } from '../utils.service';
import { forkJoin } from 'rxjs';

interface UserRow {
  userID: string,
  lastName?: string,
  firstName?: string,
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

  displayedColumns: string[] = ['userID', 'lastName', 'firstName', 'roles'];

  constructor (
    private apiService: SylvesterApiService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.isLoading = true;

    const users = this.apiService.getUsers();
    const roles = this.apiService.getRoles();
    forkJoin([users, roles]).subscribe(([users, roles]) => {
      let userRows: UserRow[] = [];
      users.forEach(user => {
        let roleList: string = '';
        
        user.roleIDs.forEach(roleID => {
          const role = roles.find(role => role._id === roleID);
          if (role) {
            if (roleList.length > 0) {
              roleList += ', ';
            }
            roleList += role.roleName;
          }
        })

        const userRow: UserRow = {
          userID: user.userID,
          lastName: user.lastName,
          firstName: user.firstName,
          roles: roleList
        }

        userRows.push(userRow);
      })

      this.sortedUsers = userRows.sort((a, b) => {
        return this.utils.compare(a.userID, b.userID, true);
      })

      this.isLoading = false;
    })
    
  }

  rowClicked(index: number): void {

  }

  addUser(): void {

  }
}
