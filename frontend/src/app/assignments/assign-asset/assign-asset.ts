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
  availableCables: Asset[] = [];

  assetTypes: string[] = [
    'Monitor', 'Desktop', 'Mini Desktop', 'Windows Laptop', 'Mac Laptop',
    'Mouse', 'Wireless Mouse', 'Headset', 'Wireless Headset', 'Keyboard', 'Wireless Keyboard',
    'Usb Camera', 'Cables', 'Laptop Bag', 'Wifi Device', 'Docking Station',
    'UPS', 'Jio/Airtel Modem', 'Others'
  ];

  cableTypes: string[] = [
    'MONITOR POWER CABLE', 'DESKTOP POWER CABLE', 'LAPTOP POWER CABLE', 'HDMI CABLE', 'DP CABLE',
    'HDMI TO VGA CABLE', 'VGA TO HDMI CABLE', 'VGA CABLE', 'WIFI EXTENDER',
    'POWER CABLE EXTENSION', 'LAN CABLE'
  ];

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private employeeService: EmployeeService,
    private assetService: AssetService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEmployees();

    this.assignmentForm = this.fb.group({
      emp_code: ['', Validators.required],
      assigned_by: ['', Validators.required],
      psd_id: ['', Validators.required],
      assignments: this.fb.array([this.createAssignment()])
    });
  }

  /** Create a single assignment row */
  createAssignment(): FormGroup {
    return this.fb.group({
      asset_code: ['', Validators.required],
      serial_number: [''],
      asset_type: ['', Validators.required],
      cable_type: [''],
      asset_brand: [''],
      processor: [''],
      charger_serial: [''],
      warranty_start: [''],
      warranty_end: [''],
      assign_date: ['', Validators.required],
      assign_remark: [''],
      isNew: [true]
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

  /** Helpers for UI control visibility */
  isLaptopOrDesktop(i: number): boolean {
    const type = (this.assignments.at(i).get('asset_type')?.value || '').toLowerCase();
    return type.includes('laptop') || type.includes('desktop') || type.includes('mini desktop');
  }

  hasCharger(i: number): boolean {
    const type = (this.assignments.at(i).get('asset_type')?.value || '').toLowerCase();
    return type.includes('laptop') || type.includes('mini desktop');
  }

  isCables(i: number): boolean {
    return (this.assignments.at(i).get('asset_type')?.value || '').toLowerCase() === 'cables';
  }

  /** Update validators based on asset type */
  onAssetTypeChange(i: number): void {
    const form = this.assignments.at(i);
    const assetType = form.get('asset_type')?.value?.toLowerCase();
    const serial = form.get('serial_number');
    const cableType = form.get('cable_type');

    if (assetType === 'cables') {
      cableType?.setValidators([Validators.required]);
      serial?.clearValidators();
      serial?.setValue('N/A');
    } else {
      cableType?.clearValidators();
      serial?.setValidators([Validators.required]);
      if (serial?.value === 'N/A') serial.setValue('');
    }

    serial?.updateValueAndValidity();
    cableType?.updateValueAndValidity();

    if (assetType === 'cables') {
      form.patchValue({
        processor: '',
        charger_serial: '',
        warranty_start: '',
        warranty_end: ''
      });
    }
  }

  /** Load available cables */
  onCableTypeChange(i: number): void {
    const form = this.assignments.at(i);
    const cableType = form.get('cable_type')?.value;
    if (!cableType) return;

    this.assetService.getAssets().subscribe((assets) => {
      this.availableCables = assets.filter(a =>
        a.asset_type.toLowerCase() === 'cables' &&
        a.cable_type === cableType &&
        a.status === 'available'
      );
      form.patchValue({ asset_code: '' });
    });
  }

  /** Validate asset code for availability */
  onAssetCodeBlur(i: number): void {
    const form = this.assignments.at(i);
    const code = form.get('asset_code')?.value?.trim();
    if (!code || this.isCables(i)) return;

    this.assetService.getAssetByCode(code).subscribe({
      next: (asset: Asset | null) => {
        if (asset) {
          if (asset.status === 'assigned') {
            this.snackBar.open(`⚠️ Asset ${code} is already assigned.`, 'Close', { duration: 3000 });
            form.get('asset_code')?.setErrors({ assigned: true });
          } else {
            form.patchValue({
              serial_number: asset.serial_number,
              asset_type: asset.asset_type,
              asset_brand: asset.asset_brand,
              processor: asset.processor,
              charger_serial: asset.charger_serial || '',
              warranty_start: asset.warranty_start,
              warranty_end: asset.warranty_end,
              isNew: false
            });
            form.get('asset_code')?.setErrors(null);
          }
        } else {
          form.patchValue({ isNew: true });
          form.get('asset_code')?.setErrors(null);
        }

        // Check charger asset if exists
        if (this.hasCharger(i) && form.get('charger_serial')?.value) {
          const chargerCode = `${code}-CH`;
          this.assetService.getAssetByCode(chargerCode).subscribe({
            next: (ch: Asset | null) => {
              if (ch && ch.status === 'assigned') {
                this.snackBar.open(`⚠️ Charger ${chargerCode} is already assigned.`, 'Close', { duration: 3000 });
                form.get('charger_serial')?.setErrors({ assigned: true });
              } else {
                form.get('charger_serial')?.setErrors(null);
              }
            }
          });
        }
      },
      error: () => {
        form.patchValue({ isNew: true });
        form.get('asset_code')?.setErrors(null);
      }
    });
  }

  /** Format date safely as YYYY-MM-DD */
  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Load employee data */
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: Employee[]) => {
        this.employees = res.filter(e => e.status === 'active');
        this.itPersons = this.employees.filter(e => e.isIT);
      },
      error: err => console.error(err)
    });
  }

  /** Submit assignment */
  onSubmit(): void {
    // Refresh validators
    this.assignments.controls.forEach((ctrl, i) => this.onAssetTypeChange(i));

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
        serial_number: this.isCables(i) ? 'N/A' : a.serial_number,
        asset_type: a.asset_type,
        asset_brand: a.asset_brand,
        processor: this.isLaptopOrDesktop(i) ? a.processor : '',
        charger_serial: this.hasCharger(i) ? a.charger_serial : '',
        cable_type: this.isCables(i) ? a.cable_type : undefined,
        emp_code: parent.emp_code,
        assigned_by: parent.assigned_by,
        psd_id: parent.psd_id,
        assign_date: this.formatDate(a.assign_date),
        assign_remark: a.assign_remark,
        warranty_start: this.isCables(i) ? '' : (a.isNew ? this.formatDate(a.warranty_start) : ''),
        warranty_end: this.isCables(i) ? '' : (a.isNew ? this.formatDate(a.warranty_end) : '')
      };

      payload.push(mainAsset);

      // Auto-add charger
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
      next: (res: any) => {
        // Check if response contains errors
        if (Array.isArray(res) && res.some(r => r.error)) {
          res.forEach(r => {
            this.snackBar.open(r.error, 'Close', { duration: 4000 });
          });
        } else {
          this.snackBar.open('✅ Assets assigned successfully.', 'Close', { duration: 3000 });
          this.assignmentForm.reset();
          this.assignmentForm.setControl('assignments', this.fb.array([this.createAssignment()]));
        }
      },
      error: err => {
        console.error(err);
        this.snackBar.open('❌ Assignment failed.', 'Close', { duration: 3000 });
      }
    });
  }
}
