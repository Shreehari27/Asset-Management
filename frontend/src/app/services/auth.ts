import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = `${environment.baseUrl}/auth`;

  constructor(private http: HttpClient) { }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  signup(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, data);
  }

  sendResetOTP(email: string) {
    return this.http.post(`${this.baseUrl}/send-reset-otp`, { email });
  }

  verifyResetOTP(payload: any) {
    return this.http.post(`${this.baseUrl}/verify-reset-otp`, payload);
  }

  // Store token+user in session storage (clears when browser closes)
  setSession(token: string, user: any): void {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getUser(): any | null {
    const s = sessionStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isIT(): boolean {
    const user = this.getUser();
    return !!(user && user.isIT);
  }
}