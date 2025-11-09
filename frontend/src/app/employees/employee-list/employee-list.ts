import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Employee, EmployeeService } from '../../services/employee';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { FilterPipe } from '../../shared/models/pipes/filter-pipe';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    RouterModule,
    FormsModule,
    FilterPipe
  ],
  templateUrl: './employee-list.html',
  styleUrls: ['./employee-list.css']
})
export class EmployeeListComponent implements OnInit {
  displayedColumns: string[] = ['emp_code', 'name', 'email', 'role', 'status', 'actions'];
  dataSource: Employee[] = [];
  filteredData: Employee[] = [];
  searchText = '';
  statusFilter = '';
  roleFilter = ''; // new filter

  constructor(private employeeService: EmployeeService, public authService: AuthService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.dataSource = data;
        this.filteredData = [...data];
      },
      error: (err) => console.error('Error fetching employees', err),
    });
  }

  applyFilter() {
    // combine role + status + search
    const s = this.searchText?.toLowerCase() || '';
    const status = this.statusFilter?.toLowerCase() || '';
    const role = this.roleFilter || '';

    this.filteredData = this.dataSource.filter(emp => {
      const matchesSearch =
        !s ||
        (emp.name && emp.name.toLowerCase().includes(s)) ||
        (emp.email && emp.email.toLowerCase().includes(s)) ||
        (emp.emp_code && emp.emp_code.toLowerCase().includes(s));

      const matchesStatus = !status || (emp.status && emp.status.toLowerCase() === status);
      const matchesRole = !role || (emp.role && emp.role === role);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }

  resetFilters() {
    this.searchText = '';
    this.statusFilter = '';
    this.roleFilter = '';
    this.filteredData = [...this.dataSource];
  }
}
