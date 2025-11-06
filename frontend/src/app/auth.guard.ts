import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // ✅ Check if user is logged in (token in session storage)
  if (auth.isLoggedIn()) {
    return true; // Allow access
  } else {
    // ❌ Redirect to login page if not authenticated
    router.navigate(['/login']);
    return false;
  }
};
