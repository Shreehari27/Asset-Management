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

  // 🔐 LOGIN
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  // 📝 SIGNUP
  signup(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, data);
  }

  // 💾 STORE TOKEN IN SESSION (clears when browser closes)
  setSession(token: string): void {
    sessionStorage.setItem('token', token);
  }

  // 🚪 LOGOUT
  logout(): void {
    sessionStorage.removeItem('token');
  }

  // ✅ CHECK LOGIN STATUS
  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }

  // 🔍 GET TOKEN FOR API CALLS (optional helper)
  getToken(): string | null {
    return sessionStorage.getItem('token');
  }
}
