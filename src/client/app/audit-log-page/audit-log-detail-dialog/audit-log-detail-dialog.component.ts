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
  isLoading: boolean = false;
  log!: SylvesterAuditLogDetail;
  oldData: any | null = null;
  oldDataKeys: string[] = [];
  newData: any | null = null;
  newDataKeys: string[] = [];

  constructor (
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: SylvesterApiService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getLogData();
  }

  getLogData(): void {
    this.isLoading = true;
    this.apiService.getAuditLog(this.data).subscribe(auditLog => {
      this.log = auditLog;

      if (this.log.oldData) {
        this.oldData = this.log.oldData;
        this.oldDataKeys = Object.keys(this.log.oldData);
        const idIndex = this.oldDataKeys.findIndex(key => key === '_id' || key === 'id');
        if (idIndex !== -1) {
          this.oldDataKeys.splice(idIndex, 1);
        }
      }
      
      if (this.log.newData) {
        this.newData = this.log.newData;
        this.newDataKeys = Object.keys(this.log.newData);
        const idIndex = this.newDataKeys.findIndex(key => key === '_id' || key === 'id');
        if (idIndex !== -1) {
          this.newDataKeys.splice(idIndex, 1);
        }
      }

      this.isLoading = false;
    })
  }

  getChangedFieldStyle(checkKey: string): string {
    const newKeyIndex = this.newDataKeys.findIndex(key => key === checkKey);
    const oldKeyIndex = this.oldDataKeys.findIndex(key => key === checkKey);

    let styleString = '';
    if (newKeyIndex !== -1) {
      if (oldKeyIndex === -1) {
        styleString = 'color: red;'
      } else {
        if (this.oldData[checkKey] !== this.newData[checkKey]) {
          styleString = 'color: red;'
        }
      }
    }

    return styleString;
  }
  
  dataChanged(checkKey: string): boolean {
    const newKeyIndex = this.newDataKeys.findIndex(key => key === checkKey);
    const oldKeyIndex = this.oldDataKeys.findIndex(key => key === checkKey);

    if (newKeyIndex !== -1) {
      if (oldKeyIndex === -1) {
        return true;
      } else {
        if (this.oldData[checkKey] !== this.newData[checkKey]) {
          return true;
        }
      }
    }

    return false;
  }
}
