import { Component, Inject, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SylvesterAuditLogDetail } from '../../nelnet/sylvester-audit-log';
import { SylvesterApiService } from '../../sylvester-api.service';

@Component({
  selector: 'app-audit-log-detail-dialog',
  templateUrl: './audit-log-detail-dialog.component.html',
  styleUrls: ['./audit-log-detail-dialog.component.scss']
})
export class AuditLogDetailDialogComponent implements OnInit {
  log!: SylvesterAuditLogDetail;

  constructor (
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: SylvesterApiService
  ) {}

  ngOnInit(): void {
    this.getLogData();
  }

  getLogData(): void {
    this.apiService.getAuditLog(this.data).subscribe(auditLog => {
      this.log = auditLog;
    })
  }

  getOldData(): string {
    const x = JSON.stringify(this.log.oldData, null, ' ');
    return JSON.stringify(this.log.oldData, null, ' ');
  }
}
