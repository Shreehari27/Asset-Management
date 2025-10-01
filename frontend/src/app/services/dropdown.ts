import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DropdownService {
  private baseUrl = `${environment.baseUrl}/DR`;

  constructor(private http: HttpClient) {}

  getAssetTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/asset-types`);
  }

  getAssetBrands(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/asset-brands`);
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees`);
  }
}
