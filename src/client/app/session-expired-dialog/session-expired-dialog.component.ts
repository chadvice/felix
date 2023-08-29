import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-session-expired-dialog',
  templateUrl: './session-expired-dialog.component.html',
  styleUrls: ['./session-expired-dialog.component.scss']
})
export class SessionExpiredDialogComponent {

  constructor (
    private router: Router,
    private auth: AuthService,
    private dialogRef: MatDialogRef<SessionExpiredDialogComponent>
  ) { }

  login(): void {
    this.router.navigate(['/homePage']).then(_ => {
      this.auth.init().then(_ => {
        this.dialogRef.close();
        this.auth.login();
      })
    })
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
