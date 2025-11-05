import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { AssignmentService } from '../../services/assignment';

@Component({
  selector: 'app-employee-assignments',
  imports: [CommonModule, MatTableModule, MatButtonModule],
  templateUrl: './employee-assignments.html',
  styleUrl: './employee-assignments.css'
})
export class EmployeeAssignments implements OnInit {
  empCode!: string;
  assignments: any[] = [];
  selected: Set<string> = new Set();
  displayedColumns: string[] = [
    'select',
    'asset_code',
    'asset_type',
    'brand',
    'serial_number',
    'assigned_date'
  ];

  constructor(
    private route: ActivatedRoute,
    private assignmentService: AssignmentService
  ) { }

  ngOnInit() {
    this.empCode = this.route.snapshot.params['emp_code'];
    this.loadAssignments();
  }

  loadAssignments() {
    this.assignmentService.getLiveAssignmentsByEmp(this.empCode).subscribe({
      next: (data) => {
        console.log('✅ Assignments fetched:', data);
        this.assignments = data;
      },
      error: (err) => console.error('Error fetching assignments', err),
    });
  }

  toggleSelection(assetCode: string, event: any) {
    if (event.target.checked) this.selected.add(assetCode);
    else this.selected.delete(assetCode);
  }

  generateGatePass() {
    const selectedAssets = Array.from(this.selected);

    if (selectedAssets.length === 0) {
      alert("Please select at least one asset.");
      return;
    }

    const payload = {
      empCode: this.empCode,
      selectedAssets: selectedAssets,
    };

    console.log("📤 Sending payload to backend:", payload);

    this.assignmentService.generateGatePass(payload).subscribe({
      next: (response: any) => {
        // Backend returns a file blob, so we need to download it
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Gatepass_${this.empCode}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error("Gate pass generation failed:", err);
        alert("Failed to generate gate pass");
      },
    });
  }


}
