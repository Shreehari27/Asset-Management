import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Asset } from '../../shared/models/asset';
import { AssetService } from '../../services/Sharedasset';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    RouterModule,
    FormsModule
  ],
  providers: [AssetService],
  templateUrl: './asset-list.html',
  styleUrls: ['./asset-list.css']
})
export class AssetList implements OnInit {
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  displayedColumns: string[] = ['asset_code', 'serial_number', 'asset_type', 'asset_brand', 'status'];

  filters = {
    serial_number: '',
    asset_type: '',
    asset_brand: '',
    status: ''
  };

  // 🔹 Predefined Asset Types
  assetTypes: string[] = [
    'Monitor',
    'Desktop',
    'Windows Laptop',
    'Mac Laptop',
    'Mouse',
    'Keyboard',
    'Usb Camera',
    'Wifi Device',
    'Headset',
    'Laptop Bag',
    'UPS',
    'Jio/Airtel Modem'
  ];

  constructor(private assetService: AssetService, private router: Router) { }

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.assetService.getAssets().subscribe({
      next: (data) => {
        this.assets = data;
        this.filteredAssets = [...data];
      },
      error: (err) => console.error('Error fetching assets:', err)
    });
  }

  applyFilters(): void {
    this.filteredAssets = this.assets.filter(asset =>
      (!this.filters.serial_number || asset.serial_number.toLowerCase().includes(this.filters.serial_number.toLowerCase())) &&
      (!this.filters.asset_type || asset.asset_type.toLowerCase() === this.filters.asset_type.toLowerCase()) &&
      (!this.filters.asset_brand || (asset.asset_brand && asset.asset_brand.toLowerCase().includes(this.filters.asset_brand.toLowerCase()))) &&
      (!this.filters.status || asset.status?.toLowerCase() === this.filters.status.toLowerCase())
    );
  }

  resetFilters(): void {
    this.filters = { serial_number: '', asset_type: '', asset_brand: '', status: '' };
    this.filteredAssets = [...this.assets];
  }

  /** Redirect to Add Asset Component */
  addAsset(): void {
    this.router.navigate(['/assets/add']);
  }
}
