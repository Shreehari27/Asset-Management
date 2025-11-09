import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService, Employee } from '../../services/employee';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './add-employee.html',
  styleUrls: ['./add-employee.css']
})
export class AddEmployee {
  form: FormGroup;

  roles: string[] = ['IT', 'Manager', 'Employee']; // ✅ available roles

  constructor(
    private fb: FormBuilder,
    private service: EmployeeService,
    private router: Router
  ) {
    this.form = this.fb.group({
      emp_code: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Employee', Validators.required] // ✅ default role
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.service.addEmployee(this.form.value as Employee).subscribe({
        next: () => this.router.navigate(['/employees']),
        error: err => console.error('❌ Error adding employee:', err)
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/employees']);
  }
}
