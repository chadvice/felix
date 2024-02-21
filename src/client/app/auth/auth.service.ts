import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { OidcClient, TokenResponse, ClientOptions } from '@pingidentity-developers-experience/ping-oidc-client-sdk';
import { AuthConfig } from '../../environments/environment';
import { SessionExpiredDialogComponent } from '../session-expired-dialog/session-expired-dialog.component';
import { Observable, catchError, lastValueFrom, of, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  oidcClient?: OidcClient;
  token?: TokenResponse;
  userInfo?: any;

  sessionExpiredDialogRef!: MatDialogRef<SessionExpiredDialogComponent>;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
  ) {
    // this.init();
  }

  async getAuthEndpoints(url: string): Promise<any> {
    const resp = this.http.get<any>(url).pipe(
      catchError(this.handleError<any>('getAuthEndpoints')),
      take(1)
    )

    return await lastValueFrom<any>(resp);
  }

  async init() {
    try {
      const endpoints = await this.getAuthEndpoints(AuthConfig.pingWellKnownEndpointsURL);

      const clientOptions: ClientOptions = {
        client_id: AuthConfig.pingClientID,
        redirect_uri: AuthConfig.pingRedirectUri,
      };

      const openIdConfig = {
        authorization_endpoint: endpoints.authorization_endpoint,
        token_endpoint: endpoints.token_endpoint,
        revocation_endpoint: endpoints.revocation_endpoint,
        userinfo_endpoint: endpoints.userinfo_endpoint,
        end_session_endpoint: endpoints.end_session_endpoint
      };

      // Workaround for PingFederate non-standard end_session_endpoint URI
      if (Object.hasOwn(endpoints, 'ping_end_session_endpoint')) {
        openIdConfig.end_session_endpoint = endpoints.ping_end_session_endpoint;
      } else {
        openIdConfig.end_session_endpoint = endpoints.end_session_endpoint;
      }
      
      // @ts-ignore
      this.oidcClient = await OidcClient.initializeClient(clientOptions, openIdConfig);

      if (await this.oidcClient.hasToken()) {
        const token = await this.oidcClient.getToken();
        await this.tokenAvailable(token);
      }
    } catch (err) {
      console.log('Error initializing OidcClient', err);
      this.sessionExpiredDialogRef = this.dialog.open(SessionExpiredDialogComponent, {disableClose: true});
    }
  }

  login() {
    this.oidcClient?.authorize();
  }

  async revokeToken() {
    await this.oidcClient?.revokeToken();
    window.location.reload();
  }

  async tokenAvailable(token: TokenResponse) {
    this.token = token;

    try {
      this.userInfo = await this.oidcClient?.fetchUserInfo();
    } catch {
      this.token = (await this.oidcClient?.refreshToken()) || undefined;
      this.userInfo = await this.oidcClient?.fetchUserInfo();
    }
  }

  logout() {
    this.oidcClient?.endSession(AuthConfig.pingEndSessionUri);
  }

  isAuthenticated(): boolean {
    if (this.token) {
      return true;
    } else {
      return false;
    }
  }

  getToken(): string | undefined {
    return this.token?.access_token;
  }

  getUserID(): string | undefined {
    return this.userInfo[AuthConfig.JWTUserIDField];
  }

  getTokenResponse(): TokenResponse | undefined {
    return this.token;
  }

  tokenExpired(): boolean {
    if (this.token) {
      const expiration = (JSON.parse(atob(this.token.access_token.split('.')[1]))).exp;
      return (Math.floor((new Date).getTime() / 1000)) >= expiration;
    } else {
      return true;
    }
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      console.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
