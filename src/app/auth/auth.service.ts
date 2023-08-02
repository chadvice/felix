import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authenticated: boolean = true;

  constructor() { }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  login(): void {
    this.authenticated = true;
  }

  logout(): void {
    this.authenticated = false;
  }
}
