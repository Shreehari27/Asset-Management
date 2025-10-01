import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Employee, EmployeeService } from '../../services/employee';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-edit-employee',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule],
  templateUrl: './edit-employee.html',
  styleUrls: ['./edit-employee.css']
})
export class EditEmployee implements OnInit {
  form: FormGroup;
  emp_code: string = '';

  constructor(
    private fb: FormBuilder,
    private service: EmployeeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      emp_code: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isIT: [false],
      status: [true]
    });
  }

  ngOnInit(): void {
    this.emp_code = this.route.snapshot.paramMap.get('id') || ''; // id is actually emp_code
    if (this.emp_code) {
      this.service.getEmployees().subscribe(employees => {
        const emp = employees.find(e => e.emp_code === this.emp_code);
        if (emp) this.form.patchValue(emp);
      });
    }
  }

  submit(): void {
    if (this.form.valid) {
      const formValue = { ...this.form.value };

      // convert boolean → enum
      formValue.status = formValue.status ? "active" : "inactive";

      this.service.updateEmployee(this.emp_code, formValue as Employee).subscribe({
        next: () => this.router.navigate(['/employees']),
        error: err => console.error(err)
      });
    }
  }


  cancel(): void {
    this.router.navigate(['/employees']);
  }
}