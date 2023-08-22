import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';

import { AuthService } from './auth/auth.service';
import { SylvesterApiService } from './sylvester-api.service';
import { ImportDataDialogComponent } from './import-data-dialog/import-data-dialog.component';

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

  importDataDialogRef!: MatDialogRef<ImportDataDialogComponent>;

  navigation = [
    { link: '/usersPage', label: 'Users', disabled: false },
    { link: '/rolesPage', label: 'Roles', disabled: false }
  ];

  constructor (
    public auth: AuthService,
    private apiService: SylvesterApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.auth.init().then(_ => {
      this.apiService.getTables().subscribe(tableNames => {
        this.tableNames = tableNames;
        console.log();
      })
    })
  }

  import(): void {
    const dialogData = this.tableNames;
    this.importDataDialogRef = this.dialog.open(ImportDataDialogComponent, {data: dialogData, disableClose: true});
  }

  newTable(): void {

  }

}
