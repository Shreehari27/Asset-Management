import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Employee {
  emp_code: string;
  name: string;
  email: string;
  role: 'IT' | 'Manager' | 'Employee';
  status: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private baseUrl = `${environment.baseUrl}/employees`;

  constructor(private http: HttpClient) { }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}`);
  }

  addEmployee(employee: Employee): Observable<any> {
    return this.http.post(`${this.baseUrl}`, employee);
  }

  updateEmployee(emp_code: string, employee: Employee): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${emp_code}`, employee);
  }

  getEmployeeById(emp_code: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/${emp_code}`);
  }

  deleteEmployee(emp_code: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${emp_code}`);
  }
}
