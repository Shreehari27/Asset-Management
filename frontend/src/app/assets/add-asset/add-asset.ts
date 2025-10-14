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
    'Monitor', 'Desktop', 'Windows Laptop', 'Mac Laptop', 
    'Mouse', 'Keyboard', 'Usb Camera', 'Wifi Device', 
    'Headset', 'Laptop Bag', 'UPS', 'Jio/Airtel Modem'
  ];

  constructor(
    private fb: FormBuilder,
    private service: AssetService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      asset_code: ['', Validators.required],
      serial_number: ['', Validators.required],
      asset_type: ['', Validators.required],
      asset_brand: ['', Validators.required],
      processor: [''],
      charger_serial: [''],
      warranty_start: [''],
      warranty_end: ['']
    });
  }

  ngOnInit(): void {}

  /** Show processor for laptops/desktops */
  isLaptopOrDesktop(): boolean {
    const type = (this.form.get('asset_type')?.value || '').toLowerCase();
    return type.includes('laptop') || type.includes('desktop') || type.includes('mini desktop');
  }

  /** Show charger only for laptops/desktops */
  hasCharger(): boolean {
    const type = (this.form.get('asset_type')?.value || '').toLowerCase();
    return type.includes('laptop') || type.includes('mini desktop');
  }

  /** Validate unique asset code */
  onAssetCodeBlur(): void {
    const code = this.form.get('asset_code')?.value?.trim();
    if (!code) return;

    this.service.getAssetByCode(code).subscribe({
      next: (asset: Asset | null) => {
        if (asset) {
          this.snackBar.open('⚠️ Asset Code already exists!', 'Close', { duration: 3000 });
          this.form.get('asset_code')?.setValue('');
        }
      },
      error: () => {
        // ignore errors, assume asset doesn't exist
      }
    });
  }

  /** Submit new unassigned asset */
  submit(): void {
    if (this.form.invalid) {
      this.snackBar.open('⚠️ Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const payload: Asset = {
      asset_code: this.form.value.asset_code,
      serial_number: this.form.value.serial_number,
      asset_type: this.form.value.asset_type,
      asset_brand: this.form.value.asset_brand,
      processor: this.isLaptopOrDesktop() ? this.form.value.processor : null,
      charger_serial: this.hasCharger() ? this.form.value.charger_serial : null,
      warranty_start: this.form.value.warranty_start,
      warranty_end: this.form.value.warranty_end
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
