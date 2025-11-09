import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth';

export const itGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const role = auth.getRole();
  const url = state.url;

  // ✅ IT → Full access
  if (role === 'IT') return true;

  // ✅ Manager → Access limited set of routes
  if (role === 'Manager') {
    const allowedPaths = [
      '/', '/dashboard',
      '/employees', '/assets',
      '/assignments/live', '/assignments/history'
    ];

    // Manager can open only these routes
    if (allowedPaths.some(path => url.startsWith(path))) return true;

    // Redirect if trying to access forbidden route
    router.navigate(['/dashboard']);
    return false;
  }

  // ✅ Employee → Only assignments/live and assignments/history
  if (role === 'Employee') {
    const allowedPaths = ['/assignments/live', '/assignments/history'];
    if (allowedPaths.some(path => url.startsWith(path))) return true;

    router.navigate(['/assignments/live']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
