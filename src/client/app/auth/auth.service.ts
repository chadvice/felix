import { Injectable } from '@angular/core';
import { OidcClient, TokenResponse } from '@pingidentity-developers-experience/ping-oidc-client-sdk';
import { AuthConfig } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  oidcClient?: OidcClient;
  token?: TokenResponse;
  userInfo?: any;

  constructor() {
    this.init();
  }

  async init() {
    try {
      this.oidcClient = await OidcClient.initializeFromOpenIdConfig(`https://auth.pingone.com/${AuthConfig.pingEnvironmentID}/as`, {
        client_id: AuthConfig.pingClientID,
        redirect_uri: AuthConfig.pingRedirectUri,
        scope: 'openid profile email, revokescope'
      });

      const x = await this.oidcClient.hasToken();
      console.log();

      if (await this.oidcClient.hasToken()) {
        const token = await this.oidcClient.getToken();
        this.tokenAvailable(token);
      }
    } catch (err) {
      console.error('Error initializing OidcClient', err);
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
}
