import { Injectable } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { OidcClient, TokenResponse } from '@pingidentity-developers-experience/ping-oidc-client-sdk';
import { AuthConfig } from '../../environments/environment';
import { SessionExpiredDialogComponent } from '../session-expired-dialog/session-expired-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  oidcClient?: OidcClient;
  token?: TokenResponse;
  userInfo?: any;

  sessionExpiredDialogRef!: MatDialogRef<SessionExpiredDialogComponent>;

  constructor(
    private dialog: MatDialog,
  ) {
    // this.init();
  }

  async init() {
    try {
      // this.oidcClient = await OidcClient.initializeFromOpenIdConfig(`https://auth.pingone.com/${AuthConfig.pingEnvironmentID}/as`, {
      this.oidcClient = await OidcClient.initializeFromOpenIdConfig(AuthConfig.pingLoginURL, {
        client_id: AuthConfig.pingClientID,
        redirect_uri: AuthConfig.pingRedirectUri,
        scope: 'openid profile email'//, revokescope'
      });

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
}
