import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { EmployeeService } from '../../services/employee';
import { Employee } from '../../services/employee';
import { Router } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-add-employee',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule],
  templateUrl: './add-employee.html',
  styleUrls: ['./add-employee.css']
})



export class AddEmployee {
  form: FormGroup;

  constructor(private fb: FormBuilder, private service: EmployeeService, private router: Router) {
    this.form = this.fb.group({
      emp_code: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isIT: [false]
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.service.addEmployee(this.form.value as Employee).subscribe({
        next: () => this.router.navigate(['/employees']),
        error: err => console.error(err)
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/employees']);
  }
}
