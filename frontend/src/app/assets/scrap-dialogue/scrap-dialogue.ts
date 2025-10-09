import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-scrap-dialogue',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  templateUrl: './scrap-dialogue.html',
  styleUrls: ['./scrap-dialogue.css']
})
export class ScrapDialogComponent implements OnInit {
  form!: FormGroup;
  itStaff: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ScrapDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { asset: any, employees: any[] }
  ) {}

  ngOnInit(): void {
    this.itStaff = this.data.employees ? this.data.employees.filter(emp => emp.isIT) : [];

    this.form = this.fb.group({
      scrap_date: [new Date(), Validators.required],
      scrap_reason: ['', Validators.required],
      scrapped_by: ['', Validators.required]
    });
  }

  confirm() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
