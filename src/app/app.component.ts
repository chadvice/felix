import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor (
    private apiService: SylvesterApiService,
    private messenger: SylvesterMessengerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiService.getTables().subscribe(tables => {
      this.tables = tables;
      this.rows = tables.data.rows;
      console.log();
    })
  }

  showTableDetail(tableName: any): void {
    this.messenger.setDetailTableName(tableName);
    this.router.navigate(['/tableDetail']);
  }
}
