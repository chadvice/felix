import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from './auth/auth.service';
import { SylvesterApiService } from './sylvester-api.service';
import { SylvesterMessengerService } from './sylvester-messenger.service';
import { table, row } from './nelnet/nelnet-table';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Sylvester';
  
  tables!: table;
  rows!: row[];
  selectedTableName: string | null = null;

  navigation = [
    { link: '/usersPage', label: 'Users', disabled: false },
    { link: '/rolesPage', label: 'Roles', disabled: false },
    { link: '/metadataPage', label: 'Metadata', disabled: false },
    { link: '/migrationsPage', label: 'Migrations', disabled: false }
  ];

  constructor (
    public auth: AuthService,
    private apiService: SylvesterApiService,
    private messenger: SylvesterMessengerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiService.getTables().subscribe(tables => {
      this.tables = tables;
      this.rows = tables.data.rows;
      
      this.router.navigate(['/homePage']);
    })
  }

  showTableDetail(table: row): void {
    this.messenger.setDetailTableName({name: table.name, description: table.description})
    this.router.navigate(['/tableDetail']);
  }
}
