import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { DashboardService } from '../services/dashboard';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatCardModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  totalAssets = 0;
  assignedAssets = 0;
  availableAssets = 0;
  totalEmployees = 0;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.totalAssets = data.totalAssets;
        this.assignedAssets = data.assignedAssets;
        this.availableAssets = data.availableAssets;
        this.totalEmployees = data.totalEmployees;
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }
}
