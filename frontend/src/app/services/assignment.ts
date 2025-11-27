import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Assignment } from '../shared/models/assignment';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private baseUrl = `${environment.baseUrl}/assignments`;

  constructor(private http: HttpClient) { }

  getLiveAssignments(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.baseUrl}/live`);
  }

  getITPersons(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.baseUrl}/employees/ITR`);
  }

  getHistory(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.baseUrl}/history`);
  }

  assignAssets(payload: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}`, payload);
  }

  returnAsset(payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${payload.asset_code}/return`, {
      return_date: payload.return_date,
      return_remark: payload.return_remark,
      return_to: payload.return_to,
      location: payload.location
    });
  }
  getLiveAssignmentsByEmp(empCode: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/live/${empCode}`);
  }

  generateGatePass(data: any) {
    return this.http.post(
      `${environment.baseUrl}/gatepass/generate`, data,
      { responseType: 'blob' } 
    );
  }
}

export type { Assignment };
