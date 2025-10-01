import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Assignment } from '../../shared/models/assignment';
import { AssignmentService } from '../../services/assignment';
import { environment } from '../../../environments/environment';

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
    HttpClientModule
  ],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class History implements OnInit {
  assignments: Assignment[] = [];
  filteredAssignments: Assignment[] = [];

  displayedColumns: string[] = [
    'asset_type',
    'asset_brand',
    'serial_number',
    'assigned_to',
    'assigned_by',
    'assign_date',
    'return_date',
    'returned_to',
    'return_remark'
  ];

  assetTypes: string[] = [
    'Monitor', 'Desktop', 'Windows laptop', 'Mac laptop',
    'Mouse', 'Keyboard', 'Usb camera', 'Wifi device',
    'Headset', 'Laptop Bag', 'UPS', 'Jio/Airtel Modem'
  ];

  filters = {
    asset_type: '',
    asset_brand: '',
    serial_number: '',
    assigned_to: ''
  };

  constructor(private assignmentService: AssignmentService) { }

  ngOnInit(): void {
    this.loadAssignments();
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
      return (
        (!this.filters.asset_type || a.asset_type === this.filters.asset_type) &&
        (!this.filters.asset_brand ||
          a.asset_brand.toLowerCase().includes(this.filters.asset_brand.toLowerCase())) &&
        (!this.filters.serial_number ||
          a.serial_number.toLowerCase().includes(this.filters.serial_number.toLowerCase())) &&
        (!this.filters.assigned_to ||
          a.emp_code.toLowerCase().includes(this.filters.assigned_to.toLowerCase()))
      );
    });
  }

  resetFilter() {
    this.filters = { asset_type: '', asset_brand: '', serial_number: '', assigned_to: '' };
    this.filteredAssignments = [...this.assignments];
  }
}