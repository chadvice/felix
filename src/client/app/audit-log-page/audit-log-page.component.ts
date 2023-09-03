import { Component, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';

import { SylvesterApiService } from '../sylvester-api.service';
import { SylvesterAuditLog } from '../nelnet/sylvester-audit-log';
import { UtilsService } from '../utils.service';

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

  constructor (
    private apiService: SylvesterApiService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
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
    localStorage.setItem('AuditLogsSortActive', this.currentSort.active);
    localStorage.setItem('AuditLogsSortDirection', this.currentSort.direction);

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
    console.log();
  }
}
