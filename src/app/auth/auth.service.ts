import { Injectable } from '@angular/core';
import { OidcClient, TokenResponse } from '@pingidentity-developers-experience/ping-oidc-client-sdk';

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
    const environmentID = '2e6fb850-41fc-4f87-9fbe-18fe1447439c';
    const clientID = 'e8e7c06f-8bd3-4554-a4ba-d5b32541cca6';

    try {
      this.oidcClient = await OidcClient.initializeFromOpenIdConfig(`https://auth.pingone.com/${environmentID}/as`, {
        client_id: clientID,
        redirect_uri: 'http://localhost:4200',
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
    this.oidcClient?.endSession('http://localhost:4200');
  }

  isAuthenticated(): boolean {
    if (this.token) {
      return true;
    } else {
      return false;
    }
  }
}
