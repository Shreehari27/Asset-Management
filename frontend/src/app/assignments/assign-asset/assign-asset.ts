import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AssignmentService } from '../../services/assignment';
import { EmployeeService, Employee } from '../../services/employee';
import { AssetService, Asset } from '../../services/Sharedasset';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-assign-asset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
  filteredEmployees: Employee[] = [];
  filteredItPersons: Employee[] = [];
  availableCables: Asset[] = [];

  /** Searchable fields */
  employeeSearch = '';
  itSearch = '';
  assetTypeSearch: string[] = [];
  cableTypeSearch: string[] = [];
  filteredAssetTypes: string[][] = [];
  filteredCableTypes: string[][] = [];

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
    private snackBar: MatSnackBar,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    const isIT = user?.isIT;
    const empCode = user?.emp_code;

    this.loadEmployees();

    this.assignmentForm = this.fb.group({
      emp_code: ['', Validators.required],
      assigned_by: [{ value: empCode, disabled: true }, Validators.required], // ✅ Locked auto-fill
      psd_id: ['', Validators.required],
      assignments: this.fb.array([this.createAssignment()])
    });

    if (!isIT) {
      this.assignmentForm.disable();
    }


    // Initialize first row filters
    this.assetTypeSearch[0] = '';
    this.filteredAssetTypes[0] = [...this.assetTypes];
    this.cableTypeSearch[0] = '';
    this.filteredCableTypes[0] = [...this.cableTypes];
  }

  /** Load employees */
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: Employee[]) => {
        this.employees = res.filter(e => e.status === 'active');
        this.itPersons = this.employees.filter(e => e.isIT);
        this.filteredEmployees = [...this.employees];
        this.filteredItPersons = [...this.itPersons];
      },
      error: err => console.error(err)
    });
  }

  /** Form array handling */
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
    const i = this.assignments.length - 1;
    this.assetTypeSearch[i] = '';
    this.filteredAssetTypes[i] = [...this.assetTypes];
    this.cableTypeSearch[i] = '';
    this.filteredCableTypes[i] = [...this.cableTypes];
  }

  removeAssignment(i: number): void {
    if (this.assignments.length > 1) this.assignments.removeAt(i);
  }

  /** Asset type helpers */
  isLaptopOrDesktop(i: number): boolean {
    const type = (this.assignments.at(i).get('asset_type')?.value || '').toLowerCase().trim();
    return ['windows laptop', 'mac laptop', 'desktop', 'mini desktop'].includes(type);
  }

  hasCharger(i: number): boolean {
    const type = (this.assignments.at(i).get('asset_type')?.value || '').toLowerCase().trim();
    return ['windows laptop', 'mac laptop', 'mini desktop'].includes(type);
  }

  isCables(i: number): boolean {
    return (this.assignments.at(i).get('asset_type')?.value || '').toLowerCase() === 'cables';
  }

  /** Search filters */
  filterEmployees(): void {
    const term = this.employeeSearch.toLowerCase();
    this.filteredEmployees = this.employees.filter(e =>
      e.name.toLowerCase().includes(term) || e.emp_code.toLowerCase().includes(term)
    );
  }

  filterItPersons(): void {
    const term = this.itSearch.toLowerCase();
    this.filteredItPersons = this.itPersons.filter(it =>
      it.name.toLowerCase().includes(term) || it.emp_code.toLowerCase().includes(term)
    );
  }

  filterAssetTypes(i: number): void {
    const term = this.assetTypeSearch[i]?.toLowerCase() || '';
    this.filteredAssetTypes[i] = this.assetTypes.filter(t => t.toLowerCase().includes(term));
  }

  filterCableTypes(i: number): void {
    const term = this.cableTypeSearch[i]?.toLowerCase() || '';
    this.filteredCableTypes[i] = this.cableTypes.filter(c => c.toLowerCase().includes(term));
  }

  /** Asset type / cable change */
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
      form.patchValue({ processor: '', charger_serial: '', warranty_start: '', warranty_end: '' });
    }
  }

  onCableTypeChange(i: number): void {
    const form = this.assignments.at(i);
    const cableType = form.get('cable_type')?.value;
    if (!cableType) return;

    this.assetService.getAssets().subscribe((assets) => {
      this.availableCables = assets.filter(a =>
        a.asset_type.toLowerCase() === 'cables' &&
        a.cable_type === cableType &&
        (a.status === 'available' || a.status === 'ready_to_be_assigned')
      );
      form.patchValue({ asset_code: '' });
    });
  }


  /** Asset code blur */
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

        // Check charger assignment
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
      error: () => form.get('asset_code')?.setErrors(null)
    });
  }

  /** Format date */
  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  displayEmp(empCode: string): string {
    if (!empCode) return '';
    const emp = this.employees.find(e => e.emp_code === empCode) || this.itPersons.find(it => it.emp_code === empCode);
    return emp ? `${emp.name} (${emp.emp_code})` : empCode;
  }

  /** Submit */
  onSubmit(): void {
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
        if (Array.isArray(res) && res.some(r => r.error)) {
          res.forEach(r => this.snackBar.open(r.error, 'Close', { duration: 4000 }));
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
