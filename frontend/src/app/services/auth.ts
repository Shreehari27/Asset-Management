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
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // convert to ms

      // Expired?
      if (Date.now() > exp) {
        this.logout();
        return false;
      }

      return true; // valid
    } catch (e) {
      // Invalid token format
      this.logout();
      return false;
    }
  }


  getRole(): string {
    const user = this.getUser();
    return user?.role || '';
  }

  isIT(): boolean {
    return this.getRole() === 'IT';
  }

  isManager(): boolean {
    return this.getRole() === 'Manager';
  }

  isEmployee(): boolean {
    return this.getRole() === 'Employee';
  }

}