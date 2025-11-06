import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth';

interface DialogData {
  assignment: any;
  employees: any[];
}

@Component({
  selector: 'app-return-dialogue',
  templateUrl: './return-dialogue.html',
  styleUrls: ['./return-dialogue.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ]
})
export class ReturnDialogComponent implements OnInit {
  returnForm!: FormGroup;
  itStaff: any[] = []; // List of IT staff

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ReturnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employees: any[] },
    private authService: AuthService
  ) { }

  ngOnInit(): void {

    const user = this.authService.getUser();
    const empCode = user?.emp_code;

    this.returnForm = this.fb.group({
      return_date: [new Date(), Validators.required],
      return_remark: [''],
      return_to: [{ value: empCode, disabled: true }, Validators.required], // ✅ Locked auto-fill
    });

  }

  onSubmit(): void {
    if (this.returnForm.valid) {
      this.dialogRef.close(this.returnForm.value);
    }
  }
}
