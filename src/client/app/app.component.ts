import { Component, OnInit } from '@angular/core';

import { AuthService } from './auth/auth.service';
import { SylvesterApiService } from './sylvester-api.service';
import { SylvesterCollectionsDocument } from './nelnet/sylvester-collection';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Sylvester';
  
  tableNames!: string[];
  selectedTableName: string | null = null;
  showSideNav: boolean = false;

  navigation = [
    { link: '/usersPage', label: 'Users', disabled: false },
    { link: '/rolesPage', label: 'Roles', disabled: false }
  ];

  constructor (
    public auth: AuthService,
    private apiService: SylvesterApiService
  ) {}

  ngOnInit(): void {
    this.auth.init().then(_ => {
      this.apiService.getTables().subscribe(tableNames => {
        this.tableNames = tableNames;
        console.log();
      })
    })
  }

}
