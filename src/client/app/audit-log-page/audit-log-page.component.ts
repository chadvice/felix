import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';

import { SylvesterApiService } from '../sylvester-api.service';
import { SylvesterAuditLog } from '../nelnet/sylvester-audit-log';
import { UtilsService } from '../utils.service';
import { AuditLogDetailDialogComponent } from './audit-log-detail-dialog/audit-log-detail-dialog.component';

@Component({
  selector: 'app-audit-log-page',
  templateUrl: './audit-log-page.component.html',
  styleUrls: ['./audit-log-page.component.scss']
})
export class AuditLogPageComponent implements OnInit {
  isLoading: boolean = false;
  logs!: SylvesterAuditLog[];
  sortedLogs!: SylvesterAuditLog[];

  currentSort: Sort = {active: '', direction: ''};
  displayedColumns: string[] = ['timeStamp', 'userID', 'lastName', 'firstName', 'message'];

  auditLogDetailDialogRef!: MatDialogRef<AuditLogDetailDialogComponent>;

  constructor (
    private apiService: SylvesterApiService,
    private utils: UtilsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const lsAuditLogsSortActive = localStorage.getItem('SylvesterAuditLogsSortActive');
    const lsAuditLogsSortDirection = localStorage.getItem('SylvesterAuditLogsSortDirection');
    if (lsAuditLogsSortActive && lsAuditLogsSortDirection) {
      this.currentSort.active = lsAuditLogsSortActive;
      this.currentSort.direction = localStorage.getItem('SylvesterAuditLogsSortDirection') === 'asc' ? 'asc' : 'desc';
    }
    this.getLogs();
  }

  getLogs(): void {
    this.isLoading = true;
    this.apiService.getAuditLogs().subscribe(auditLogs => {
      this.logs = auditLogs;

      this.sortLogs(this.currentSort);
      this.isLoading = false;
    })
  }

  sortLogs(sort: Sort): void {
    this.currentSort = sort;
    localStorage.setItem('SylvesterAuditLogsSortActive', this.currentSort.active);
    localStorage.setItem('SylvesterAuditLogsSortDirection', this.currentSort.direction);

    const data = this.logs.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedLogs = data;
      return;
    }

    this.sortedLogs = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'timeStamp': return this.utils.compare(new Date(a.timeStamp).getTime(), new Date(b.timeStamp).getTime(), isAsc);
        case 'userID': return this.utils.compare(a.userID, b.userID, isAsc);
        case 'lastName': return this.utils.compare(a.lastName, b.lastName, isAsc);
        case 'firstName': return this.utils.compare(a.firstName, b.firstName, isAsc);
        default: return 0;
      }
    });
  }

  rowClicked(index: number): void {
    this.auditLogDetailDialogRef = this.dialog.open(AuditLogDetailDialogComponent, {data: this.sortedLogs[index]._id});
  }
}
