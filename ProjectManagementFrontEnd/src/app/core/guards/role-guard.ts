import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as string[] | undefined;
  const userRole = auth.role();

  if (allowedRoles && userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Logged in, but wrong role — redirect to projects list instead of login.
  router.navigateByUrl('/projects');
  return false;
};