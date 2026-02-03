import type { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated) {
    return true;
  }

  const code = new URLSearchParams(state.url.split('?')[1] ?? '').get('code');
  if (code) {
    return authService.handleAuthCallback(code).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  authService.initiateLogin();
  return false;
};
