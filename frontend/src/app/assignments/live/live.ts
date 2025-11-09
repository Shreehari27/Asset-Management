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
import { Assignment } from '../../shared/models/assignment';
import { AssignmentService } from '../../services/assignment';
import { AuthService } from '../../services/auth';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReturnDialogComponent } from '../return-dialogue/return-dialogue';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { EmployeeService, Employee } from '../../services/employee';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    RouterModule,
    MatTooltipModule
  ],
  templateUrl: './live.html',
  styleUrls: ['./live.css']
})
export class Live implements OnInit {
  assignments: Assignment[] = [];
  filteredAssignments: Assignment[] = [];
  employeeMap = new Map<string, Employee>();
  itEmployees: Employee[] = [];

  displayedColumns: string[] = [
    'assigned_to',
    'psd_id',
    'asset_code',
    'asset_type',
    'asset_brand',
    'serial_number',
    'assign_date',
    'assigned_by',
    'assign_remark',
    'actions'
  ];

  filters = {
    asset_type: '',
    asset_brand: '',
    serial_number: '',
    assigned_to: '',
    psd_id: ''
  };

  assetTypes: string[] = [
    'Monitor', 'Desktop', 'Windows Laptop', 'Mac Laptop',
    'Mouse', 'Keyboard', 'USB Camera', 'WiFi Device',
    'Headset', 'Laptop Bag', 'UPS', 'Jio/Airtel Modem'
  ];

  constructor(
    private assignmentService: AssignmentService,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadAssignments();
    this.loadITEmployees();
    if (!this.authService.isIT()) {
      this.displayedColumns = this.displayedColumns.filter(c => c !== 'actions');
    }
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
    this.assignmentService.getLiveAssignments().subscribe({
      next: data => {
        this.assignments = data;
        this.filteredAssignments = [...data];
      },
      error: err => console.error(err)
    });
  }

  loadITEmployees(): void {
    this.assignmentService.getITPersons().subscribe({
      next: data => this.itEmployees = data,
      error: err => console.error(err)
    });
  }

  markReturned(assignment: Assignment): void {
    const dialogRef = this.dialog.open(ReturnDialogComponent, {
      width: '450px',
      data: { assignment, employees: this.itEmployees }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const returnDate = new Date(result.return_date);
        const formattedDate = returnDate.toISOString().slice(0, 19).replace('T', ' ');

        this.assignmentService.returnAsset({
          asset_code: assignment.asset_code,
          return_date: formattedDate,
          return_remark: result.return_remark,
          return_to: result.return_to
        }).subscribe(() => this.loadAssignments());
      }
    });
  }

  filterAssignments() {
    this.filteredAssignments = this.assignments.filter(a => {
      const emp = this.employeeMap.get(a.emp_code);

      const matchesEmployee =
        !this.filters.assigned_to ||
        a.emp_code.toLowerCase().includes(this.filters.assigned_to.toLowerCase()) ||
        (emp &&
          (emp.name.toLowerCase().includes(this.filters.assigned_to.toLowerCase()) ||
            emp.email.toLowerCase().includes(this.filters.assigned_to.toLowerCase())));

      return (
        (!this.filters.asset_type || a.asset_type.toLowerCase() === this.filters.asset_type.toLowerCase()) &&
        (!this.filters.asset_brand || a.asset_brand.toLowerCase().includes(this.filters.asset_brand.toLowerCase())) &&
        (!this.filters.serial_number || a.serial_number.toLowerCase().includes(this.filters.serial_number.toLowerCase())) &&
        (!this.filters.psd_id || a.psd_id.toLowerCase().includes(this.filters.psd_id.toLowerCase())) &&
        matchesEmployee
      );
    });
  }



  resetFilter() {
    this.filters = {
      asset_type: '',
      asset_brand: '',
      serial_number: '',
      assigned_to: '',
      psd_id: ''
    };
    this.filteredAssignments = [...this.assignments];
  }

}
