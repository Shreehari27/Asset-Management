import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Asset } from '../../shared/models/asset';
import { AssetService } from '../../services/asset';
import { DropdownService } from '../../services/dropdown';

@Component({
  selector: 'app-add-asset',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule],
  templateUrl: './add-asset.html',
  styleUrls: ['./add-asset.css']
})
export class AddAsset implements OnInit {
  assetTypes: string[] = [];
  assetBrands: string[] = [];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: AssetService,
    private dropdown: DropdownService,
    private router: Router
  ) {
    this.form = this.fb.group({
      asset_code: ['', Validators.required],
      serial_number: ['', Validators.required],
      asset_type: ['', Validators.required],   // ✅ required by API
      asset_brand: ['', Validators.required],  // ✅ required by API
      status: ['Available']
    });
  }

  ngOnInit(): void {
    this.dropdown.getAssetTypes().subscribe((types: string[]) => (this.assetTypes = types));
    this.dropdown.getAssetBrands().subscribe((brands: string[]) => (this.assetBrands = brands));
  }

  submit(): void {
    if (this.form.valid) {
      // Only send what API needs
      const payload = {
        asset_code: this.form.value.asset_code,
        serial_number: this.form.value.serial_number,
        asset_type: this.form.value.asset_type,
        asset_brand: this.form.value.asset_brand
      };

      this.service.addAsset(payload as Asset).subscribe({
        next: () => this.router.navigate(['/assets']),
        error: (err) => console.error(err)
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/assets']);
  }
}