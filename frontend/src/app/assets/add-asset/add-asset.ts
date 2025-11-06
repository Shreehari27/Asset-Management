import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { AssetService } from '../../services/Sharedasset';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-asset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
  ],
  templateUrl: './add-asset.html',
  styleUrls: ['./add-asset.css'],
})
export class AddAsset implements OnInit {
  form: FormGroup;

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

  locations: string[] = ['Office-ECITY', 'EmployeeWFH'];


  nextCableNumber = 1;
  initialized = false;

  constructor(
    private fb: FormBuilder,
    private service: AssetService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      assets: this.fb.array([this.createAssetGroup()]),
    });
  }

  ngOnInit(): void {
    this.service.getAssets().subscribe({
      next: (assets: any[]) => {
        const cableAssets = assets
          .filter((a) => a.asset_type?.toLowerCase() === 'cables')
          .map((a) => a.asset_code);
        const maxNum = this.extractMaxCableNumber(cableAssets);
        this.nextCableNumber = maxNum + 1;
        this.initialized = true;
      },
      error: () => {
        this.snackBar.open('⚠️ Failed to fetch existing assets.', 'Close', { duration: 3000 });
      },
    });
  }

  extractMaxCableNumber(codes: string[]): number {
    let max = 0;
    codes.forEach((code) => {
      const match = code?.match(/C(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    return max;
  }

  get assets(): FormArray {
    return this.form.get('assets') as FormArray;
  }

  createAssetGroup(): FormGroup {
    const group = this.fb.group({
      asset_type: ['', Validators.required],
      asset_code: ['', Validators.required],
      serial_number: ['', Validators.required],
      cable_type: [''],
      asset_brand: [''],
      purchase_date: ['', Validators.required],
      lot_number: [{ value: '', disabled: true }, Validators.required], // 🔒 Read-only
      processor: [''],
      charger_serial: [''],
      warranty_start: [''],
      warranty_end: [''],
      model_name: [''],
      location: ['Office-ECITY', Validators.required],
    });

    // 🔁 Auto-generate lot number when purchase date changes
    group.get('purchase_date')?.valueChanges.subscribe(() => this.updateLotNumber(group));

    return group;
  }

  /** Generate lot number based on purchase date only (LT + date + month + year) */
  updateLotNumber(group: FormGroup): void {
    const date = group.get('purchase_date')?.value;
    if (!date) return;

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    const lot = `LT${day}${month}${year}`;
    group.get('lot_number')?.setValue(lot, { emitEvent: false });
  }

  addAssetRow(): void {
    this.assets.push(this.createAssetGroup());
  }

  removeAssetRow(index: number): void {
    this.assets.removeAt(index);
  }

  onAssetTypeChange(index: number): void {
    const type = this.assets.at(index).get('asset_type')?.value;

    if (type === 'Cables') {
      this.assets.at(index).patchValue({ serial_number: 'N/A' });
      const nextCode = `C${this.nextCableNumber.toString().padStart(3, '0')}`;
      this.assets.at(index).get('asset_code')?.setValue(nextCode);
      this.nextCableNumber++;
    } else {
      this.assets.at(index).patchValue({ asset_code: '', serial_number: '' });
    }
  }

  isLaptopOrDesktop(index: number): boolean {
    const type = (this.assets.at(index).get('asset_type')?.value || '').toLowerCase().trim();
    return ['windows laptop', 'mac laptop', 'desktop', 'mini desktop'].includes(type);
  }

  hasCharger(index: number): boolean {
    const type = (this.assets.at(index).get('asset_type')?.value || '').toLowerCase().trim();
    return ['windows laptop', 'mac laptop', 'mini desktop'].includes(type);
  }

  isCable(index: number): boolean {
    return (this.assets.at(index).get('asset_type')?.value || '').toLowerCase() === 'cables';
  }

  submit(): void {
    if (this.form.invalid) {
      this.snackBar.open('⚠️ Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const payload = this.form.getRawValue().assets; // includes disabled (read-only) fields

    payload.forEach((a: any) => {
      // Date conversion
      a.warranty_start = a.warranty_start ? new Date(a.warranty_start) : null;
      a.warranty_end = a.warranty_end ? new Date(a.warranty_end) : null;
      a.purchase_date = a.purchase_date ? new Date(a.purchase_date) : null;

      // Brand & Model formatting (First letter uppercase, rest lowercase)
      if (a.asset_brand) {
        a.asset_brand = a.asset_brand.charAt(0).toUpperCase() + a.asset_brand.slice(1).toLowerCase();
      }

      if (a.model_name) {
        a.model_name = a.model_name.charAt(0).toUpperCase() + a.model_name.slice(1).toLowerCase();
      }
    });


    this.service.addNewAsset(payload).subscribe({
      next: (res: any) => {
        const addedCount = res.added?.length || 0;
        const skippedCount = res.skipped?.length || 0;
        const message = `✅ ${addedCount} added, ⚠️ ${skippedCount} skipped`;
        this.snackBar.open(message, 'Close', { duration: 4000 });
        if (addedCount > 0) this.router.navigate(['/assets']);
      },
      error: (err) => {
        console.error('❌ Failed to add assets:', err);
        this.snackBar.open('❌ Failed to add assets.', 'Close', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/assets']);
  }
}
