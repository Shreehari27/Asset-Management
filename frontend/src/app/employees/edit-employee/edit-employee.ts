import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Employee, EmployeeService } from '../../services/employee';

@Component({
  selector: 'app-edit-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './edit-employee.html',
  styleUrls: ['./edit-employee.css']
})
export class EditEmployee implements OnInit {
  form: FormGroup;
  emp_code = '';
  roles = ['IT', 'Manager', 'Employee'];

  constructor(
    private fb: FormBuilder,
    private service: EmployeeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      emp_code: [{ value: '', disabled: true }],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Employee', Validators.required],
      status: [true]
    });
  }

  ngOnInit(): void {
    this.emp_code = this.route.snapshot.paramMap.get('id') || '';

    if (this.emp_code) {
      this.service.getEmployees().subscribe(employees => {
        const emp = employees.find(e => e.emp_code === this.emp_code);
        if (emp) {
          this.form.patchValue({
            emp_code: emp.emp_code,
            name: emp.name,
            email: emp.email,
            role: emp.role,
            status: emp.status === 'active'
          });
        }
      });
    }
  }

  submit(): void {
    if (this.form.valid) {
      const formValue = { ...this.form.getRawValue() };
      formValue.status = formValue.status ? 'active' : 'inactive';

      this.service.updateEmployee(this.emp_code, formValue as Employee).subscribe({
        next: () => this.router.navigate(['/employees']),
        error: err => console.error('❌ Update failed:', err)
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/employees']);
  }
}
