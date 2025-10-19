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
import { MatDividerModule } from '@angular/material/divider';
import { AssetService, Asset } from '../../services/Sharedasset';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

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
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './assign-asset.html',
  styleUrls: ['./assign-asset.css']
})
export class AssignAsset implements OnInit {
  assignmentForm!: FormGroup;
  employees: Employee[] = [];
  itPersons: Employee[] = [];

  assetTypes = [
    'Desktop', 'Windows Laptop', 'Mac Laptop', 'Monitor', 'Mouse',
    'Keyboard', 'Mini Desktop', 'UPS', 'WiFi Device'
  ];

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private employeeService: EmployeeService,
    private assetService: AssetService,
    private snackBar: MatSnackBar
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

  /** Create single assignment form group */
  createAssignment(): FormGroup {
    return this.fb.group({
      asset_code: ['', Validators.required],
      serial_number: [''],
      asset_type: ['', Validators.required],
      asset_brand: [''],
      processor: [''],
      charger_serial: [''],
      warranty_start: [''],
      warranty_end: [''],
      assign_date: ['', Validators.required],
      assign_remark: [''],
      isNew: [true] // true if asset is new
    });
  }

  get assignments(): FormArray {
    return this.assignmentForm.get('assignments') as FormArray;
  }

  addAssignment(): void {
    this.assignments.push(this.createAssignment());
  }

  removeAssignment(i: number): void {
    if (this.assignments.length > 1) this.assignments.removeAt(i);
  }

  isLaptopOrDesktop(i: number): boolean {
    const type = (this.assignments.at(i).get('asset_type')?.value || '').toLowerCase();
    return type.includes('laptop') || type.includes('desktop') || type.includes('mini desktop');
  }

  hasCharger(i: number): boolean {
    const type = (this.assignments.at(i).get('asset_type')?.value || '').toLowerCase();
    return type.includes('laptop') || type.includes('mini desktop');
  }

  /** Format date as YYYY-MM-DD */
  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Load employees from service */
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: Employee[]) => {
        this.employees = res.filter(e => e.status === 'active');
        this.itPersons = this.employees.filter(e => e.isIT);
      },
      error: err => console.error(err)
    });
  }

  /** Autofill asset details if asset code exists, otherwise do nothing */
  onAssetCodeBlur(i: number): void {
    const form = this.assignments.at(i);
    const code = form.get('asset_code')?.value?.trim();
    if (!code) return; // do nothing if empty

    this.assetService.getAssetByCode(code).subscribe({
      next: (asset: Asset | null) => {
        if (asset) {
          // Autofill if found
          form.patchValue({
            serial_number: asset.serial_number,
            asset_type: asset.asset_type,
            asset_brand: asset.asset_brand,
            processor: asset.processor,
            charger_serial: asset.charger_serial || '', // ✅ NEW LINE
            warranty_start: asset.warranty_start,
            warranty_end: asset.warranty_end,
            isNew: false
          });
        } else {
          // Asset not found → leave form as-is, no warning
          form.patchValue({ isNew: true });
        }
      },
      error: () => {
        // Optional: silently ignore backend error, do not show warning
        form.patchValue({ isNew: true });
      }
    });
  }


  /** Submit assignments to backend */
  onSubmit(): void {
    if (this.assignmentForm.invalid) {
      this.snackBar.open('⚠️ Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const parent = this.assignmentForm.value;
    const payload: Asset[] = [];

    for (let i = 0; i < parent.assignments.length; i++) {
      const a = parent.assignments[i];

      const mainAsset: Asset = {
        asset_code: a.asset_code,
        serial_number: a.serial_number,
        asset_type: a.asset_type,
        asset_brand: a.asset_brand,
        processor: this.isLaptopOrDesktop(i) ? a.processor : '',
        charger_serial: this.hasCharger(i) ? a.charger_serial : '',
        emp_code: parent.emp_code,
        assigned_by: parent.assigned_by,
        psd_id: parent.psd_id,
        assign_date: this.formatDate(a.assign_date),
        assign_remark: a.assign_remark,
        warranty_start: a.isNew ? this.formatDate(a.warranty_start) : '',
        warranty_end: a.isNew ? this.formatDate(a.warranty_end) : ''
      };

      payload.push(mainAsset);

      // Automatically add charger asset if applicable
      if (this.hasCharger(i) && a.charger_serial) {
        payload.push({
          asset_code: `${a.asset_code}-CH`,
          serial_number: a.charger_serial,
          asset_type: 'Charger',
          asset_brand: a.asset_brand,
          emp_code: parent.emp_code,
          assigned_by: parent.assigned_by,
          psd_id: parent.psd_id,
          assign_date: this.formatDate(a.assign_date),
          assign_remark: `Assigned along with ${a.asset_code}`,
          parent_asset_code: a.asset_code
        });
      }
    }

    this.assignmentService.assignAssets(payload).subscribe({
      next: () => {
        this.snackBar.open('✅ Assets assigned successfully.', 'Close', { duration: 3000 });
        this.assignmentForm.reset();
        this.assignmentForm.setControl('assignments', this.fb.array([this.createAssignment()]));
      },
      error: err => {
        console.error(err);
        this.snackBar.open('❌ Assignment failed.', 'Close', { duration: 3000 });
      }
    });
  }
}
