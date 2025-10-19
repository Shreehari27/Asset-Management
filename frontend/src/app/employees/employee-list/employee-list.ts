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
  displayedColumns: string[] = ['emp_code', 'name', 'email', 'isIT', 'status', 'actions'];
  dataSource: Employee[] = [];
  filteredData: Employee[] = [];
  searchText: string = '';
  statusFilter: string = '';

  constructor(private employeeService: EmployeeService) {}

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
    if (!this.statusFilter) {
      this.filteredData = [...this.dataSource];
    } else {
      this.filteredData = this.dataSource.filter(
        (emp) => emp.status?.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }
  }

  deleteEmployee(emp_code: string) {
    this.employeeService.deleteEmployee(emp_code).subscribe(() => {
      this.loadEmployees();
    });
  }
}

export type { Employee };
