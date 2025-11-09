import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../services/dashboard';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatExpansionModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  totalAssets = 0;
  assignedAssets = 0;
  availableAssets = 0;
  scrappedAssets = 0;
  totalEmployees = 0;

  assetTypeSummary: any = {};
  cableTypeSummary: any = {};

  reorderLevelSummary: any[] = [];
  lotStatistics: any[] = [];
  cableSummary: any[] = [];

  tally: any = null; // ✅ Tally summary data
  fromMonth = '';
  toMonth = '';

  objectKeys = Object.keys;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit() {
    // 📊 Dashboard Stats
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.totalAssets = data.totalAssets;
        this.assignedAssets = data.assignedAssets;
        this.availableAssets = data.availableAssets;
        this.scrappedAssets = data.scrappedAssets;
        this.totalEmployees = data.totalEmployees;
        this.assetTypeSummary = data.assetTypeSummary || {};
        this.cableTypeSummary = data.cableTypeSummary || {};
      },
      error: (err) => console.error('Error loading stats:', err)
    });

    // 📦 Reorder Level Summary
    this.dashboardService.getReorderLevelSummary().subscribe({
      next: (data) => (this.reorderLevelSummary = data.summary || []),
      error: (err) => console.error('Error fetching reorder level:', err)
    });

    // 🧾 Inventory Summary
    this.dashboardService.getInventorySummary().subscribe({
      next: (data) => {
        this.lotStatistics = data.lot_statistics || [];
        this.cableSummary = data.cable_summary || [];
      },
      error: (err) => console.error('Error fetching inventory summary:', err)
    });

    // 🧮 Tally Summary
    this.dashboardService.getTallySummary().subscribe({
      next: (data) => (this.tally = data),
      error: (err) => console.error('Error fetching tally summary:', err)
    });
  }

  // 📥 Download Stock Summary Excel
  downloadStock() {
    const { from, to } = this.getDateRange();
    if (!from || !to) return alert('⚠️ Please select valid month range!');
    this.dashboardService.downloadStockSummary(from, to);
  }

  // 📥 Download Ledger Report Excel
  downloadLedger() {
    const { from, to } = this.getDateRange();
    if (!from || !to) return alert('⚠️ Please select valid month range!');
    this.dashboardService.downloadLedgerReport(from, to);
  }

  // 📥 Download Reorder Level Report Excel
  downloadReorder() {
    const { from, to } = this.getDateRange();
    if (!from || !to) return alert('⚠️ Please select valid month range!');
    this.dashboardService.downloadReorderLevelReport(from, to);
  }

  // 📥 Download Age Analysis Report (no date range needed)
  downloadAgeAnalysis() {
    this.dashboardService.downloadAgeAnalysisReport();
  }



  // 🔧 Helper - Convert month to YYYY-MM-DD range
  private getDateRange() {
    if (!this.fromMonth || !this.toMonth) return { from: null, to: null };
    const [y1, m1] = this.fromMonth.split('-');
    const [y2, m2] = this.toMonth.split('-');
    const from = `${y1}-${m1}-01`;
    const lastDay = new Date(+y2, +m2, 0).toISOString().split('T')[0];
    return { from, to: lastDay };
  }
}
