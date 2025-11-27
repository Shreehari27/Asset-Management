import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
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
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
    RouterModule
  ],
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
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // 1) FIRST: handle Google callback token (if present) — do this before initializing the form
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error) {
      // show friendly message if backend redirected with an error flag
      if (error === 'Unauthorized') {
        this.snackBar.open('Access denied — your Google email is not registered as an employee.', 'Close', { duration: 4000 });
      } else {
        this.snackBar.open('Google sign-in failed: ' + error, 'Close', { duration: 4000 });
      }
    }

    if (token) {
      try {
        // validate basic token shape before using it
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid token');

        const payload = JSON.parse(atob(parts[1]));
        // minimal validation: payload should have emp_code or email or role
        if (!payload || (!payload.emp_code && !payload.email)) {
          throw new Error('Token payload invalid');
        }

        // save session and navigate
        this.authService.setSession(token, payload);

        // replace URL without query params to avoid reprocessing
        this.router.navigate(['/dashboard'], { replaceUrl: true });
        return;
      } catch (err) {
        console.error('Google login processing failed', err);
        this.snackBar.open('Google login failed (invalid token).', 'Close', { duration: 3500 });
        // continue to show normal login form
      }
    }

    // 2) No token — initialize form normally
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
        const msg = err?.error?.message || 'Login failed. Please check your credentials.';
        this.snackBar.open(msg, 'Close', { duration: 3500 });
        this.loading = false;
      }
    });
  }

  continueWithGoogle() {
    // will navigate browser to backend OAuth start endpoint
    window.location.href = `${this.authService.authBaseUrl}/google`;
  }
}
