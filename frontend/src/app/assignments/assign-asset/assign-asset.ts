import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AssignmentService } from '../../services/assignment';
import { EmployeeService, Employee } from '../../services/employee';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: 'app-assign-asset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatDivider
],
  templateUrl: './assign-asset.html',
  styleUrls: ['./assign-asset.css']
})
export class AssignAsset implements OnInit {
  assignmentForm!: FormGroup;
  employees: Employee[] = [];
  itPersons: Employee[] = [];

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
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();

    this.assignmentForm = this.fb.group({
      emp_code: ['', Validators.required],
      assigned_by: ['', Validators.required],
      assignments: this.fb.array([this.createAssignment()])
    });
  }

  // Create one assignment row (child form)
  createAssignment(): FormGroup {
    return this.fb.group({
      asset_code: ['', Validators.required],
      serial_number: ['', Validators.required],
      asset_type: ['', Validators.required],
      asset_brand: [''],
      assign_date: ['', Validators.required],
      assign_remark: ['']
    });
  }

  get assignments(): FormArray {
    return this.assignmentForm.get('assignments') as FormArray;
  }

  addAssignment(): void {
    this.assignments.push(this.createAssignment());
  }

  removeAssignment(index: number): void {
    if (this.assignments.length > 1) {
      this.assignments.removeAt(index);
    }
  }

  // Load employees + IT persons
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res) => {
        this.employees = res;
        this.itPersons = res.filter((emp) => emp.isIT); // only IT staff
      },
      error: (err) => console.error('Failed to load employees', err)
    });
  }

  // Submit all assignments in bulk
onSubmit(): void {
  if (this.assignmentForm.invalid) {
    alert('Please fill all required fields.');
    return;
  }

  const parentValues = {
    emp_code: this.assignmentForm.value.emp_code,
    assigned_by: this.assignmentForm.value.assigned_by
  };

  // Fix: format dates properly
  const payload = this.assignmentForm.value.assignments.map((a: any) => ({
    ...a,
    emp_code: parentValues.emp_code,
    assigned_by: parentValues.assigned_by,
    assign_date: this.formatDate(a.assign_date)   // 👈 fix here
  }));

  this.assignmentService.assignAssets(payload).subscribe({
    next: (res) => {
      console.log('✅ Bulk Assignment Success:', res);
      alert('✅ Assets assigned successfully');
      this.assignmentForm.reset();
      this.assignmentForm.setControl('assignments', this.fb.array([this.createAssignment()]));
    },
    error: (err) => {
      console.error('❌ Assignment Failed:', err);
      alert('❌ Failed to assign assets');
    }
  });
}

// Utility function to format JS Date → YYYY-MM-DD
private formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}


  // Helper method to get detailed form validation errors
  getFormValidationErrors(): any {
    const result: any = {};
    Object.keys(this.assignmentForm.controls).forEach(key => {
      const control = this.assignmentForm.get(key);
      if (control && control.errors) {
        result[key] = control.errors;
      }
    });

    // Check nested form array errors
    const assignments = this.assignmentForm.get('assignments') as FormArray;
    if (assignments) {
      result['assignments'] = [];
      assignments.controls.forEach((control, index) => {
        if (control instanceof FormGroup && control.errors) {
          result['assignments'][index] = control.errors;
        }
      });
    }

    return result;
  }
}
