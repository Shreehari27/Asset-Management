import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth';

export const itGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.isIT()) return true;

  // optional: redirect to dashboard and show message
  router.navigate(['/dashboard']);
  return false;
};
