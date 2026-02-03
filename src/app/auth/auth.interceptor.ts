import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthConfigService } from './services/auth-config.service';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const configService = inject(AuthConfigService);
  const config = configService.getConfig();

  // Clone request and add device key header
  let authReq = req.clone({ 
    setHeaders: {
      'X-iBabs-Device-Id': config.deviceKey
    }    
  });

  // Add auth token if available
  const token = authService.currentToken;
  if (token) {
    authReq = authReq.clone({
      withCredentials:true,
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      // Handle 401 errors by attempting token refresh
      if (error.status === 401 && token) {
        return authService.refreshAccessToken().pipe(
          switchMap(() => {
            const newToken = authService.currentToken;
            const retryReq = authReq.clone({
              setHeaders: {
                'Authorization': `Bearer ${newToken}`
              }
            });
            return next(retryReq);
          }),
          catchError(refreshError => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};
