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
    'Wireless Mouse',
    'Wireless Keyboard',
    'Mini Desktop',
    'USB splitter/Extension',
    'Laptop Charger',
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
  ) { }

  ngOnInit(): void {
    this.loadEmployees();

    this.assignmentForm = this.fb.group({
      emp_code: ['', Validators.required],
      assigned_by: ['', Validators.required],
      psd_id: ['', Validators.required],
      assignments: this.fb.array([this.createAssignment()])
    });
  }

  // 🔹 create each assignment row
  createAssignment(): FormGroup {
    return this.fb.group({
      asset_code: ['', Validators.required],
      serial_number: ['', Validators.required],
      asset_type: ['', Validators.required],
      asset_brand: [''],
      charger_serial: [''], // ✅ optional field for laptop charger
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

  // 🔹 Helper function for showing charger field in HTML
  isLaptop(index: number): boolean {
    const control = this.assignments.at(index);
    const type = (control.get('asset_type')?.value || '').toLowerCase();
    return type.includes('laptop') || type.includes('mini desktop');
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res) => {
        this.employees = res;
        this.itPersons = res.filter((emp) => emp.isIT);
      },
      error: (err) => console.error('Failed to load employees', err)
    });
  }

  // 🔹 Format date helper
  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  // ✅ MAIN SUBMIT FUNCTION (includes charger logic)
  onSubmit(): void {
    if (this.assignmentForm.invalid) {
      alert('Please fill all required fields.');
      return;
    }

    const parentValues = {
      emp_code: this.assignmentForm.value.emp_code,
      assigned_by: this.assignmentForm.value.assigned_by,
      psd_id: this.assignmentForm.value.psd_id
    };

    const assignmentsArray: any[] = [];

    for (const a of this.assignmentForm.value.assignments) {
      // --- main asset ---
      const mainAsset = {
        ...a,
        emp_code: parentValues.emp_code,
        assigned_by: parentValues.assigned_by,
        psd_id: parentValues.psd_id,
        assign_date: this.formatDate(a.assign_date)
      };
      assignmentsArray.push(mainAsset);

      // --- if laptop, add charger automatically ---
      // --- if laptop or mini desktop, add charger automatically ---
      if (
        (a.asset_type.toLowerCase().includes('laptop') ||
          a.asset_type.toLowerCase().includes('mini desktop')) &&
        a.charger_serial
      ) {
        assignmentsArray.push({
          asset_code: a.asset_code + '-CH',
          serial_number: a.charger_serial,
          asset_type: 'Charger',
          asset_brand: a.asset_brand,
          emp_code: parentValues.emp_code,
          assigned_by: parentValues.assigned_by,
          psd_id: parentValues.psd_id,
          assign_date: this.formatDate(a.assign_date),
          assign_remark: 'Assigned along with ' + a.asset_type + ' ' + a.asset_code,
          parent_asset_code: a.asset_code // link to parent
        });
      }
    }

    console.log('📦 Final Payload to API:', assignmentsArray);

    this.assignmentService.assignAssets(assignmentsArray).subscribe({
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
}