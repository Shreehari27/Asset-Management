import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { DashboardService } from '../services/dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule],
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
  objectKeys = Object.keys; // helper to use in template

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
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
  }
}
