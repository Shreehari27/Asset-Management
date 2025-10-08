import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCard } from "@angular/material/card";
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-scrap-asset',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule, MatCard],
  templateUrl: './scrap-asset.html',
  styleUrl: './scrap-asset.css'
})
export class ScrapAsset implements OnInit {
  scrapForm!: FormGroup;
  assetDetails: any = null;
  assetValid = false;

  private apiBase = environment.baseUrl; // ✅ use from environment

  constructor(private fb: FormBuilder, private http: HttpClient) { }

  ngOnInit(): void {
    this.scrapForm = this.fb.group({
      asset_code: ['', Validators.required],
      scrap_date: ['', Validators.required],
      scrap_reason: ['', Validators.required]
    });
  }

  // 🔍 Fetch asset details when asset_code is entered
  fetchAsset(): void {
    const code = this.scrapForm.value.asset_code?.trim();
    if (!code) return;

    this.http.get(`${this.apiBase}/scrap/details/${code}`).subscribe({
      next: (res: any) => {
        this.assetDetails = res;
        this.assetValid = res.status === 'available';
        if (!this.assetValid) {
          alert('Asset is not available for scrapping');
        }
      },
      error: () => {
        this.assetDetails = null;
        this.assetValid = false;
        alert('Asset not found');
      }
    });
  }


  // 🗑️ Submit scrap details
  submitScrap(): void {
    if (!this.scrapForm.valid || !this.assetValid) {
      alert('Please enter valid asset details');
      return;
    }

    const payload = this.scrapForm.value;
    // ✅ Convert date to YYYY-MM-DD (so MySQL accepts it)
    payload.scrap_date = new Date(payload.scrap_date).toISOString().slice(0, 10);


    this.http.post(`${this.apiBase}/scrap`, payload).subscribe({
      next: () => {
        alert(`Asset ${payload.asset_code} scrapped successfully`);
        this.scrapForm.reset();
        this.assetDetails = null;
        this.assetValid = false;
      },
      error: (err) => {
        console.error(err);
        alert('Failed to scrap asset');
      }
    });

  }
}
