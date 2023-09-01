import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from './auth/auth.service';
import { SylvesterApiService } from './sylvester-api.service';
import { ImportDataDialogComponent } from './import-data-dialog/import-data-dialog.component';
import { SylvesterCollectionsDocument } from './nelnet/sylvester-collection';
import { SylvesterMessengerService } from './sylvester-messenger.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Sylvester';
  
  tables!: SylvesterCollectionsDocument[];
  selectedTableName: string | null = null;
  showSideNav: boolean = false;

  importDataDialogRef!: MatDialogRef<ImportDataDialogComponent>;

  tableDeletedSubscription!: Subscription;

  navigation = [
    { link: '/usersPage', label: 'Users', disabled: false },
    { link: '/rolesPage', label: 'Roles', disabled: false }
  ];

  constructor (
    public auth: AuthService,
    private apiService: SylvesterApiService,
    private dialog: MatDialog,
    private messenger: SylvesterMessengerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tableDeletedSubscription = this.messenger.tableDeleted.subscribe(deleted => {
      if (deleted) {
        this.getTables();
      }
    });

    this.auth.init().then(_ => {
      this.getTables();
    })
  }

  ngOnDestroy(): void {
    this.tableDeletedSubscription.unsubscribe();
  }

  login(): void {
    this.router.navigate(['/homePage']).then(_ => {
      this.auth.init().then(_ => {
        this.auth.login();
      })
    })
  }

  getTables(): void {
    const userID = this.auth.getUserID();
    if (userID) {
      this.apiService.getTablesForUser(userID).subscribe(tables => {
        this.tables = tables;
      })
    }
    // this.apiService.getTables().subscribe(tables => {
    //   this.tables = tables;
    // })
  }

  import(): void {
    this.importDataDialogRef = this.dialog.open(ImportDataDialogComponent, {disableClose: true, height: '80%'});
    this.importDataDialogRef.afterClosed().subscribe(resp => {
      if (resp) {
        this.getTables();
        this.messenger.setTablesUpdated(true);
      }
    })
  }

  newTable(): void {
    console.log();
  }

}
