import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH_401_REDIRECT } from './auth-context.tokens';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');

  const requestWithAuth = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(requestWithAuth).pipe(
    catchError((error: unknown) => {
      const isAuthLoginRequest = req.url.includes('/security/login') || req.url.includes('/security/oauth/login');
      const skipGlobal401Handling = req.context.get(SKIP_AUTH_401_REDIRECT);
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthLoginRequest && !skipGlobal401Handling) {
        authService.logout();
        void router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
