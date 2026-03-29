import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validateStoredSession().pipe(
    map((isValid) => (isValid ? true : router.createUrlTree(['/auth/login'], { queryParams: { reason: 'expired' } })))
  );
};
