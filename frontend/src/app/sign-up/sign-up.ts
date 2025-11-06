import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    RouterModule
  ],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export class Signup implements OnInit {
  signupForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.snackBar.open('⚠️ Please enter valid details.', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.authService.signup(this.signupForm.value).subscribe({
      next: () => {
        this.snackBar.open('✅ Signup successful! You can now log in.', 'Close', { duration: 3000 });
        this.router.navigate(['/login']);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Signup failed:', err);
        this.snackBar.open(err.error?.message || 'Signup failed.', 'Close', { duration: 3000 });
        this.loading = false;
      },
    });
  }
}

