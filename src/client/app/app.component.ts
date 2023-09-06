import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from './auth/auth.service';
import { UtilsService } from './utils.service';
import { SylvesterApiService } from './sylvester-api.service';
import { ImportDataDialogComponent } from './import-data-dialog/import-data-dialog.component';
import { NewTableEditorDialogComponent } from './table-detail/new-table-editor-dialog/new-table-editor-dialog.component';
import { SylvesterCollectionsDocument } from './nelnet/sylvester-collection';
import { SylvesterMessengerService } from './sylvester-messenger.service';
import { SylvesterUser } from './nelnet/sylvester-user';

interface navItem {
  permissionName: string,
  link: string,
  label: string,
  disabled: boolean
}

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
  newTableDialogRef!: MatDialogRef<NewTableEditorDialogComponent>;

  tableDeletedSubscription!: Subscription;

  userID!: string;
  userInfo!: SylvesterUser;

  canImportData: boolean = false;
  canCreateTables: boolean = false;

  navigation: navItem[] = [
    { permissionName: 'canEditUsers', link: '/usersPage', label: 'Users', disabled: true },
    { permissionName: 'canEditRoles', link: '/rolesPage', label: 'Roles', disabled: true },
    { permissionName: 'canViewAuditLogs', link: '/auditLogsPage', label: 'Audit Logs', disabled: true }
  ];

  constructor (
    public auth: AuthService,
    private utils: UtilsService,
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
      const userID = this.auth.getUserID();
      if (userID) {
        this.userID = userID;
        this.apiService.getUserInfo(this.userID).subscribe(userInfo => {
          this.userInfo = userInfo;
          this.updateNavigationItems();
          this.updateUserPermissions();
        })
      }
      this.getTables();
    })
  }

  updateUserPermissions(): void {
    if (this.userInfo.canCreateTable) {
      this.canCreateTables = this.userInfo.canCreateTable;
    }

    if (this.userInfo.canImport) {
      this.canImportData = this.userInfo.canImport;
    }
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
    if (this.userID) {
      this.apiService.getTablesForUser(this.userID).subscribe(tables => {
        this.tables = tables.sort((a, b) => {
          return this.utils.compare(a.name.toLowerCase(), b.name.toLowerCase(), true);
        });
      })
    }
  }

  updateNavigationItems(): void {
    for (let n = 0; n < this.navigation.length; n++) {      
      this.navigation[n].disabled = !<boolean>this.userInfo[this.navigation[n].permissionName as keyof SylvesterUser];
    }
  }

  import(): void {
    this.importDataDialogRef = this.dialog.open(ImportDataDialogComponent, {disableClose: true, height: '80%'});
    this.importDataDialogRef.afterClosed().subscribe(resp => {
      if (resp) {
        this.apiService.clearTablesCache();
        this.getTables();
        this.messenger.setTablesUpdated(true);
      }
    })
  }

  newTable(): void {
    this.newTableDialogRef = this.dialog.open(NewTableEditorDialogComponent, {width: '80%', disableClose: true});
    this.newTableDialogRef.afterClosed().subscribe(resp => {
      if (resp) {
        console.log();
      }
    })
  }

}
