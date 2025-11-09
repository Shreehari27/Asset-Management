import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ScrapDialogComponent } from '../scrap-dialogue/scrap-dialogue';
import { AssignmentService } from '../../services/assignment';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCard } from "@angular/material/card";

@Component({
  selector: 'app-scrap-asset',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCard
],
  templateUrl: './scrap-asset.html',
  styleUrls: ['./scrap-asset.css']
})
export class ScrapAsset implements OnInit {
  assets: any[] = [];
  filteredAssets: any[] = [];
  displayedColumns: string[] = ['asset_code', 'serial_number', 'asset_type', 'asset_brand', 'status', 'actions'];
  itEmployees: any[] = [];

  assetTypes: string[] = [
    'Monitor', 'Desktop', 'Windows Laptop', 'Mac Laptop', 'Wireless Mouse', 'Wireless Keyboard',
    'Mini Desktop', 'USB splitter/Extension', 'Laptop Charger', 'Mouse', 'Keyboard',
    'USB Camera', 'WiFi Device', 'Headset', 'Laptop Bag', 'UPS', 'Jio/Airtel Modem'
  ];

  filters = { asset_code: '', serial_number: '', asset_type: '', asset_brand: '' };

  constructor(private http: HttpClient, private dialog: MatDialog, private assignmentService: AssignmentService) {}

  ngOnInit() {
    this.loadITEmployees();
    this.loadAssets();
  }

  loadITEmployees() {
    this.assignmentService.getITPersons().subscribe({
      next: data => this.itEmployees = data,
      error: err => console.error(err)
    });
  }

  loadAssets() {
    this.http.get<any[]>(`${environment.baseUrl}/assets`).subscribe({
      next: res => {
        this.assets = res.filter(asset => asset.status !== 'scrapped' && asset.status !== 'assigned');
        this.filteredAssets = [...this.assets];
      },
      error: err => console.error(err)
    });
  }

  applyFilter() {
    const code = this.filters.asset_code.toLowerCase();
    const serial = this.filters.serial_number.toLowerCase();
    const type = this.filters.asset_type.toLowerCase();
    const brand = this.filters.asset_brand.toLowerCase();

    this.filteredAssets = this.assets.filter(asset =>
      asset.asset_code.toLowerCase().includes(code) &&
      asset.serial_number.toLowerCase().includes(serial) &&
      asset.asset_type.toLowerCase().includes(type) &&
      asset.asset_brand.toLowerCase().includes(brand)
    );
  }

  resetFilter() {
    this.filters = { asset_code: '', serial_number: '', asset_type: '', asset_brand: '' };
    this.filteredAssets = [...this.assets];
  }

  formatForMySQL(date: Date | string) {
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  openScrapDialog(asset: any) {
    const dialogRef = this.dialog.open(ScrapDialogComponent, {
      width: '450px',
      data: { asset, employees: this.itEmployees }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = {
          asset_code: asset.asset_code,
          scrap_date: this.formatForMySQL(result.scrap_date || new Date()),
          scrap_reason: result.scrap_reason || '',
          scrapped_by: result.scrapped_by || 'SYSTEM'
        };

        this.http.post(`${environment.baseUrl}/scrap`, payload).subscribe({
          next: () => {
            alert('Asset scrapped successfully!');
            this.loadAssets();
          },
          error: err => {
            console.error('Error scrapping asset:', err);
            alert(err.error?.error || 'Failed to scrap asset');
          }
        });
      }
    });
  }
}
