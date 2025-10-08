import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Assignment } from '../../shared/models/assignment';
import { AssignmentService } from '../../services/assignment';
import { EmployeeService, Employee } from '../../services/employee';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-history',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatTooltipModule
  ],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class History implements OnInit {
  assignments: Assignment[] = [];
  filteredAssignments: Assignment[] = [];
  employeeMap = new Map<string, Employee>();

  displayedColumns: string[] = [
    'assigned_to',
    'psd_id',
    'asset_code',
    'asset_type',
    'asset_brand',
    'serial_number',
    'assign_date',
    'assigned_by',
    'return_date',
    'returned_to',
    'return_remark'
  ];

  assetTypes: string[] = [
    'Monitor', 'Desktop', 'Windows Laptop', 'Mac Laptop',
    'Mouse', 'Keyboard', 'USB Camera', 'WiFi Device',
    'Headset', 'Laptop Bag', 'UPS', 'Jio/Airtel Modem'
  ];

  filters = {
    asset_type: '',
    asset_brand: '',
    serial_number: '',
    assigned_to: ''
  };

  constructor(
    private assignmentService: AssignmentService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadAssignments();
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employeeMap = new Map(data.map(emp => [emp.emp_code, emp]));
      },
      error: err => console.error(err)
    });
  }

  loadAssignments(): void {
    this.assignmentService.getHistory().subscribe({
      next: (data: Assignment[]) => {
        this.assignments = data;
        this.filteredAssignments = [...data];
      },
      error: err => console.error(err)
    });
  }

  filterAssignments() {
  this.filteredAssignments = this.assignments.filter(a => {
    const emp = this.employeeMap.get(a.emp_code);

    // Match employee by code, name, or email
    const matchesEmployee = !this.filters.assigned_to ||
      a.emp_code.toLowerCase().includes(this.filters.assigned_to.toLowerCase()) ||
      (emp && (
        emp.name.toLowerCase().includes(this.filters.assigned_to.toLowerCase()) ||
        emp.email.toLowerCase().includes(this.filters.assigned_to.toLowerCase())
      ));

    return (
      (!this.filters.asset_type || a.asset_type.toLowerCase() === this.filters.asset_type.toLowerCase()) &&
      (!this.filters.asset_brand || a.asset_brand.toLowerCase().includes(this.filters.asset_brand.toLowerCase())) &&
      (!this.filters.serial_number || a.serial_number.toLowerCase().includes(this.filters.serial_number.toLowerCase())) &&
      matchesEmployee
    );
  });
}


  resetFilter() {
    this.filters = { asset_type: '', asset_brand: '', serial_number: '', assigned_to: '' };
    this.filteredAssignments = [...this.assignments];
  }
}