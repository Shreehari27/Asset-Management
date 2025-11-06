import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  goToForgot() {
    this.router.navigate(['/forgot-password']);
  }


  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.snackBar.open('Please fill in all fields correctly', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        this.authService.setSession(response.token, response.user);
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Login failed', err);
        this.snackBar.open('Login failed. Please check your credentials.', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}
