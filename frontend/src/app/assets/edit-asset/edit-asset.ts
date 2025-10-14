import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Asset } from '../../shared/models/asset';
import { AssetService } from '../../services/Sharedasset';
import { DropdownService } from '../../services/dropdown';

@Component({
  selector: 'app-edit-asset',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './edit-asset.html',
  styleUrls: ['./edit-asset.css']
})
export class EditAsset implements OnInit {
  assetForm!: FormGroup;
  assetId!: string;
  assetTypes: string[] = [];
  assetBrands: string[] = [];

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private dropdownService: DropdownService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.assetId = this.route.snapshot.paramMap.get('id')!;

    this.assetForm = this.fb.group({
      asset_code: ['', Validators.required],
      serial_number: ['', Validators.required],
      asset_type: ['', Validators.required],
      asset_brand: ['', Validators.required],
      status: ['', Validators.required]
    });

    this.loadDropdowns();
    this.loadAsset();
  }

  loadDropdowns(): void {
    this.dropdownService.getAssetTypes().subscribe({
      next: (types: string[]) => this.assetTypes = types,
      error: (err: any) => console.error('Error loading asset types', err)
    });
    this.dropdownService.getAssetBrands().subscribe({
      next: (brands: string[]) => this.assetBrands = brands,
      error: (err: any) => console.error('Error loading asset brands', err)
    });
  }

  loadAsset(): void {
    this.assetService.getAssetByCode(this.assetId).subscribe({
      next: (asset: Asset | null) => {
        if (asset) {
          this.assetForm.patchValue(asset);
        }
      },
      error: (err: any) => console.error('Error loading asset', err)
    });
  }

  onSubmit(): void {
    if (this.assetForm.valid) {
      const asset: Asset = this.assetForm.value;
      this.assetService.updateAsset(asset.asset_code, asset).subscribe({
        next: () => {
          this.router.navigate(['/assets']);
        },
        error: (err: any) => console.error('Error updating asset', err)
      });
    }
  }

}
