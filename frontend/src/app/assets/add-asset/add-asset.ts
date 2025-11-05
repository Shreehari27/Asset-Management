import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { AssetService, Asset } from '../../services/Sharedasset';
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
    MatSnackBarModule
  ],
  templateUrl: './add-asset.html',
  styleUrls: ['./add-asset.css']
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

  constructor(
    private fb: FormBuilder,
    private service: AssetService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      asset_type: ['', Validators.required],
      asset_code: [''],
      serial_number: [''],
      cable_type: [''],
      asset_brand: [''],
      processor: [''],
      charger_serial: [''],
      warranty_start: [''],
      warranty_end: ['']
    });
  }

  ngOnInit(): void { }

  isLaptopOrDesktop(): boolean {
    const type = (this.form.get('asset_type')?.value || '').toLowerCase().trim();
    return ['windows laptop', 'mac laptop', 'desktop', 'mini desktop'].includes(type);
  }

  hasCharger(): boolean {
    const type = (this.form.get('asset_type')?.value || '').toLowerCase().trim();
    return ['windows laptop', 'mac laptop', 'mini desktop'].includes(type);
  }

  isCable(): boolean {
    return (this.form.get('asset_type')?.value || '').toLowerCase() === 'cables';
  }

  onAssetTypeChange(): void {
    const type = this.form.get('asset_type')?.value;

    if (type === 'Cables') {
      this.form.patchValue({ serial_number: 'N/A' });
      this.generateCableAssetCode();
    } else {
      this.form.patchValue({ asset_code: '', serial_number: '' });
    }
  }

  generateCableAssetCode(): void {
    this.service.getAssets().subscribe((assets) => {
      const cableAssets = assets.filter(a => a.asset_type === 'Cables');
      const nextNum = cableAssets.length + 1;
      const code = `C${nextNum.toString().padStart(3, '0')}`;
      this.form.get('asset_code')?.setValue(code);
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.snackBar.open('⚠️ Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const payload: Asset = {
      asset_type: this.form.value.asset_type,
      asset_code: this.form.value.asset_code,
      serial_number: this.form.value.serial_number,
      asset_brand: this.form.value.asset_brand,
      cable_type: this.isCable() ? this.form.value.cable_type : undefined,
      processor: this.isLaptopOrDesktop() ? this.form.value.processor : undefined,
      charger_serial: this.hasCharger() ? this.form.value.charger_serial : undefined,
      warranty_start: this.form.value.warranty_start,
      warranty_end: this.form.value.warranty_end,
      status: 'ready_to_be_assigned' // ✅ always ready_to_be_assigned
    };

    this.service.addNewAsset(payload).subscribe({
      next: () => {
        this.snackBar.open('✅ Asset added successfully.', 'Close', { duration: 3000 });
        this.router.navigate(['/assets']);
      },
      error: (err) => {
        console.error('❌ Failed to add asset:', err);
        this.snackBar.open('❌ Failed to add asset.', 'Close', { duration: 3000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/assets']);
  }
}
