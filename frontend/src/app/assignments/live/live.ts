import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Assignment } from '../../shared/models/assignment';
import { AssignmentService } from '../../services/assignment';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReturnDialogComponent } from '../return-dialogue/return-dialogue';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-live',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule
  ],
  templateUrl: './live.html',
  styleUrls: ['./live.css']
})
export class Live implements OnInit {
  assignments: Assignment[] = [];
  filteredAssignments: Assignment[] = [];
  employees: any[] = [];
  itEmployees: any[] = []; // IT persons from API

  displayedColumns: string[] = [
    'asset_type',
    'asset_brand',
    'serial_number',
    'assigned_to',
    'assigned_by',
    'assign_date',
    'assign_remark',
    'actions'
  ];

  filters = {
    asset_type: '',
    asset_brand: '',
    serial_number: '',
    assigned_to: ''
  };

  // Fixed asset type dropdown
  assetTypes: string[] = [
    'Monitor',
    'Desktop',
    'Windows Laptop',
    'Mac Laptop',
    'Mouse',
    'Keyboard',
    'USB Camera',
    'WiFi Device',
    'Headset',
    'Laptop Bag',
    'UPS',
    'Jio/Airtel Modem'
  ];

  constructor(
    private assignmentService: AssignmentService,
    private http: HttpClient,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadAssignments();
    this.loadEmployees();
    this.loadITEmployees(); // fetch IT persons from API
  }

  // Load all live assignments
  loadAssignments(): void {
    this.assignmentService.getLiveAssignments().subscribe({
      next: data => {
        this.assignments = data;
        this.filteredAssignments = [...data];
      },
      error: err => console.error(err)
    });
  }

  // Load all employees (normal)
  loadEmployees(): void {
    this.http.get<any[]>(`${environment.baseUrl}/employees`).subscribe({
      next: data => this.employees = data,
      error: err => console.error(err)
    });
  }

  // Load all employees and filter IT staff
  loadITEmployees(): void {
    this.assignmentService.getITPersons().subscribe({
      next: data => {
        this.itEmployees = data; // IT employees only
        console.log('IT Employees loaded:', this.itEmployees);
      },
      error: err => console.error('Error loading IT employees:', err)
    });
  }

  // Open dialog to return asset
  markReturned(assignment: Assignment): void {
    const dialogRef = this.dialog.open(ReturnDialogComponent, {
      width: '450px',
      data: {
        assignment: assignment,
        employees: this.itEmployees // IT employees only
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Convert JS Date to MySQL DATETIME string
        const returnDate = new Date(result.return_date);
        const formattedDate = returnDate.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS

        this.assignmentService.returnAsset({
          asset_code: assignment.asset_code,
          return_date: formattedDate,
          return_remark: result.return_remark,
          return_to: result.return_to
        }).subscribe({
          next: () => this.loadAssignments(),
          error: err => console.error(err)
        });
      }
    });
  }


  // Filter assignments based on search
  async filterAssignments() {
    let assignedToEmpCode = '';

    if (this.filters.assigned_to) {
      const query = this.filters.assigned_to.toLowerCase();
      const matched = this.employees.find(emp =>
        emp.emp_code.toLowerCase() === query || emp.email.toLowerCase() === query
      );
      if (matched) assignedToEmpCode = matched.emp_code;
    }

    this.filteredAssignments = this.assignments.filter(a => {
      return (!this.filters.asset_type || a.asset_type === this.filters.asset_type)
        && (!this.filters.asset_brand || a.asset_brand.toLowerCase().includes(this.filters.asset_brand.toLowerCase()))
        && (!this.filters.serial_number || a.serial_number.toLowerCase().includes(this.filters.serial_number.toLowerCase()))
        && (!this.filters.assigned_to ||
          a.emp_code.toLowerCase() === this.filters.assigned_to.toLowerCase() ||
          a.emp_code.toLowerCase() === assignedToEmpCode.toLowerCase()
        );
    });
  }

  // Reset all filters
  resetFilter() {
    this.filters = { asset_type: '', asset_brand: '', serial_number: '', assigned_to: '' };
    this.filteredAssignments = [...this.assignments];
  }
}
