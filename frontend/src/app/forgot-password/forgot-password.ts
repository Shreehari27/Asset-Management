import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  step = 1;
  emailForm: FormGroup;
  otpForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private auth: AuthService
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  sendOTP(): void {
    const email = this.emailForm.value.email;
    this.auth.sendResetOTP(email).subscribe({
      next: () => {
        this.snack.open('OTP sent to your email!', 'Close', { duration: 3000 });
        this.step = 2;
      },
      error: (err) => {
        console.error('❌ OTP send failed:', err);
        this.snack.open('Failed to send OTP. Try again.', 'Close', { duration: 3000 });
      },
    });
  }

  resetPassword(): void {
    const data = {
      email: this.emailForm.value.email,
      otp: this.otpForm.value.otp,
      newPassword: this.otpForm.value.newPassword,
    };

    this.auth.verifyResetOTP(data).subscribe({
      next: () => {
        this.snack.open('Password reset successful! You can log in now.', 'Close', { duration: 3000 });
        this.step = 3;
      },
      error: (err) => {
        console.error('❌ Reset failed:', err);
        this.snack.open('Invalid or expired OTP.', 'Close', { duration: 3000 });
      },
    });
  }
}

