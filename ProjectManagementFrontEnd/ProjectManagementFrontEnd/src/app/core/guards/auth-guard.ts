import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Not logged in — redirect to login, remembering where they tried to go.
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};