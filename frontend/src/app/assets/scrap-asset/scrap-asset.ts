import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-scrap-asset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatSelectModule
  ],
  templateUrl: './scrap-asset.html',
  styleUrls: ['./scrap-asset.css']
})
export class ScrapAsset implements OnInit {
  scrapForm!: FormGroup;
  assetDetails: any = null;
  assetValid = false;
  itPersons: any[] = [];

  private apiBase = environment.baseUrl; 

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.scrapForm = this.fb.group({
      asset_code: ['', Validators.required],
      scrap_date: [new Date(), Validators.required],
      scrap_reason: ['', Validators.required],
      scrapped_by: ['', Validators.required]
    });

    this.loadITEmployees();
  }

  loadITEmployees(): void {
    this.http.get(`${this.apiBase}/employees/ITR`).subscribe({
      next: (res: any) => this.itPersons = res || [],
      error: (err) => {
        console.error('Failed to load IT employees', err);
        this.itPersons = [];
      }
    });
  }

  fetchAsset(): void {
    const code = this.scrapForm.value.asset_code?.trim();
    if (!code) {
      this.assetDetails = null;
      this.assetValid = false;
      return;
    }

    this.http.get(`${this.apiBase}/scrap/details/${encodeURIComponent(code)}`).subscribe({
      next: (res: any) => {
        console.log('Fetched Asset:', res);
        this.assetDetails = res;
        this.assetValid = res?.status?.toLowerCase() === 'available';
        if (!this.assetValid) alert('Asset is not available for scrapping');
      },
      error: (err) => {
        console.error('Asset lookup failed', err);
        this.assetDetails = null;
        this.assetValid = false;
        alert('Asset not found');
      }
    });
  }

  submitScrap(): void {
    console.log('🟢 Scrap button clicked');

    if (this.scrapForm.invalid || !this.assetValid) {
      alert('Please enter valid asset details and ensure the asset is available.');
      return;
    }

    const form = this.scrapForm.value;
    const payload = {
      asset_code: form.asset_code.trim(),
      scrap_date: new Date(form.scrap_date).toISOString().slice(0, 10),
      scrap_reason: form.scrap_reason,
      scrapped_by: form.scrapped_by
    };

    console.log('Submitting Payload:', payload);

    this.http.post(`${this.apiBase}/scrap`, payload).subscribe({
      next: (res: any) => {
        alert(`✅ Asset ${payload.asset_code} scrapped successfully`);
        this.scrapForm.reset({
          asset_code: '',
          scrap_date: new Date(),
          scrap_reason: '',
          scrapped_by: ''
        });
        this.assetDetails = null;
        this.assetValid = false;
      },
      error: (err) => {
        console.error('Failed to scrap asset', err);
        const msg = err?.error?.error || err?.error?.message;
        alert(`❌ Failed to scrap asset: ${msg || 'Server error'}`);
      }
    });
  }
}
