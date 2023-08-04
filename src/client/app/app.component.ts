import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from './auth/auth.service';
import { SylvesterApiService } from './sylvester-api.service';
import { table } from './nelnet/nelnet-table';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Sylvester';
  
  tables!: table;
  rows!: any[];
  selectedTableName: string | null = null;

  navigation = [
    { link: '/usersPage', label: 'Users', disabled: false },
    { link: '/rolesPage', label: 'Roles', disabled: false },
    { link: '/tableDetail/Metadata', label: 'Metadata', disabled: false },
    { link: '/tableDetail/migrations/Migrations', label: 'Migrations', disabled: false }
  ];

  constructor (
    public auth: AuthService,
    private apiService: SylvesterApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.init().then(_ => {
      this.apiService.getTables().subscribe(tables => {
        this.tables = tables;
        this.rows = tables.data.rows;
      })
    })
  }

}
