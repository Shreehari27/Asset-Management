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
import { AuthService } from '../../services/auth';

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
    @Inject(MAT_DIALOG_DATA) public data: { asset: any, employees: any[] },
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    const empCode = user?.emp_code;

    this.form = this.fb.group({
      scrap_date: [new Date(), Validators.required],
      scrap_reason: ['', Validators.required],
      scrapped_by: [{ value: empCode, disabled: true }, Validators.required], // ✅ Auto-filled
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
