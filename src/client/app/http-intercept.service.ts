import { Injectable } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth/auth.service';
import { SessionExpiredDialogComponent } from './session-expired-dialog/session-expired-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptService implements HttpInterceptor {
  sessionExpiredDialogRef!: MatDialogRef<SessionExpiredDialogComponent>;

  constructor(
    private dialog: MatDialog,
    private auth: AuthService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // if (this.auth.tokenExpired()) {
    //   this.sessionExpiredDialogRef = this.dialog.open(SessionExpiredDialogComponent, {disableClose: true});
    // }
    return next.handle(req);
  }
}
