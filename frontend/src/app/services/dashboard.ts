import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = `${environment.baseUrl}`;

  constructor(private http: HttpClient) { }

  // -------------------------------
  // Dashboard Stats
  // -------------------------------
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/stats`);
  }

  // -------------------------------
  //  Reports & Summaries
  // -------------------------------

  // Single Asset Ledger Report
  getLedgerReport(assetCode: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/ledger/${assetCode}`);
  }

  // Stock Summary (lot → type → brand)
  getStockSummary(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/stock-summary`);
  }

  //  Reorder Level Summary
  getReorderLevelSummary(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/reorder-level`);
  }

  // Inventory Summary (lot + cable)
  getInventorySummary(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/inventory-summary`);
  }

  //  Tally Summary (check lot sum vs total assets)
  getTallySummary(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/tally`);
  }

  // -------------------------------
  //  Download Reports (Excel)
  // -------------------------------

  //  Stock Summary Excel
  downloadStockSummary(fromDate: string, toDate: string): void {
    const url = `${this.baseUrl}/reports/download/stock-summary?fromDate=${fromDate}&toDate=${toDate}`;
    window.open(url, '_blank');
  }

  //  Ledger Report Excel
  downloadLedgerReport(fromDate: string, toDate: string): void {
    const url = `${this.baseUrl}/reports/download/ledger-report?fromDate=${fromDate}&toDate=${toDate}`;
    window.open(url, '_blank');
  }

  // Reorder Level Report Excel
  downloadReorderLevelReport(fromDate: string, toDate: string): void {
    const url = `${this.baseUrl}/reports/download/reorder-level?fromDate=${fromDate}&toDate=${toDate}`;
    window.open(url, '_blank');
  }

  // 🕒 Age Analysis Report Excel
  downloadAgeAnalysisReport(): void {
    const url = `${this.baseUrl}/reports/download/age-analysis`;
    window.open(url, '_blank');
  }


}
