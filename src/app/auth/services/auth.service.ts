import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, tap, catchError, switchMap, timer } from 'rxjs';
import { AuthState, TokenData } from '../../authtypes';
import { AuthConfigService } from './auth-config.service';
import { TokenStorageService } from './token-storage.service';
import { PkceService } from './pkce.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

   private authStateSubject = new BehaviorSubject<AuthState>({
    token: null,
    isAuthenticated: false,
    loginInProgress: false,
    error: null
  });

  public authState$ = this.authStateSubject.asObservable();
  private tokenRefreshTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: AuthConfigService,
    private pkceService: PkceService,
    private tokenStorage: TokenStorageService
  ) {
    this.initializeAuthState();
  }

  get currentToken(): string | null {
    return this.authStateSubject.value.token;
  }

  get isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  private initializeAuthState(): void {
    const storedToken = this.tokenStorage.getAccessToken();
    
    if (storedToken && !this.tokenStorage.isTokenExpired(storedToken)) {
      this.updateAuthState({
        token: storedToken,
        isAuthenticated: true,
        loginInProgress: false,
        error: null
      });
      this.setupTokenRefresh();
    } else {
      this.tokenStorage.clearTokens();
    }
  }

  async initiateLogin(): Promise<void> {
    this.tokenStorage.savePreLoginPath(this.router.url);

    const codeVerifier = this.pkceService.generateCodeVerifier();
    const codeChallenge = await this.pkceService.generateCodeChallenge(codeVerifier);
    
    this.pkceService.storeCodeVerifier(codeVerifier);

    const config = this.configService.getConfig();
    const authParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      device_key: config.deviceKey
    });

    this.updateAuthState({ ...this.authStateSubject.value, loginInProgress: true });
    
    window.location.href = `${config.authorizationEndpoint}?${authParams.toString()}`;
  }

  handleAuthCallback(authorizationCode: string): Observable<void> {
    const codeVerifier = this.pkceService.retrieveCodeVerifier();
    
    if (!codeVerifier) {
      return throwError(() => new Error('PKCE code verifier not found'));
    }

    return this.exchangeCodeForTokens(authorizationCode, codeVerifier).pipe(
      tap(() => {
        this.pkceService.clearCodeVerifier();
        const redirectPath = this.tokenStorage.getPreLoginPath();
        this.router.navigateByUrl(redirectPath);
      }),
      catchError(error => {
        this.updateAuthState({
          ...this.authStateSubject.value,
          error: 'Authentication failed',
          loginInProgress: false
        });
        return throwError(() => error);
      })
    );
  }

  private exchangeCodeForTokens(code: string, verifier: string): Observable<void> {
    const config = this.configService.getConfig();
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: verifier,
      device_key: config.deviceKey
    });

    return this.http.post<TokenData>(
      config.tokenEndpoint,
      requestBody.toString(),
      { headers }
    ).pipe(
      tap(response => this.handleTokenResponse(response)),
      switchMap(() => new Observable<void>(observer => {
        observer.next();
        observer.complete();
      }))
    );
  }

  refreshAccessToken(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    const currentToken = this.currentToken;

    if (!refreshToken || !currentToken) {
      this.performLogout();
      return throwError(() => new Error('No refresh token available'));
    }

    const config = this.configService.getConfig();
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${currentToken}`
    });

    const requestBody = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      device_key: config.deviceKey
    });

    return this.http.post<TokenData>(
      config.tokenEndpoint,
      requestBody.toString(),
      { headers }
    ).pipe(
      tap(response => this.handleTokenResponse(response)),
      catchError(error => {
        this.performLogout();
        return throwError(() => error);
      }),
      switchMap(() => new Observable<void>(observer => {
        observer.next();
        observer.complete();
      }))
    );
  }

  logout(): void {
    this.performLogout();
    this.router.navigate(['/login']);
  }

  private handleTokenResponse(response: TokenData): void {
    this.tokenStorage.saveAccessToken(response.access_token);
    this.tokenStorage.saveRefreshToken(response.refresh_token);
    
    this.updateAuthState({
      token: response.access_token,
      isAuthenticated: true,
      loginInProgress: false,
      error: null
    });

    this.setupTokenRefresh();
  }

  private setupTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unsubscribe();
    }

    const token = this.currentToken;
    if (!token) return;

    const expiryTime = this.tokenStorage.getTokenExpiryTime(token);
    if (!expiryTime) return;

    // Refresh 5 minutes before expiry
    const refreshTime = expiryTime - Date.now() - (5 * 60 * 1000);

    if (refreshTime > 0) {
      this.tokenRefreshTimer = timer(refreshTime).pipe(
        switchMap(() => this.refreshAccessToken())
      ).subscribe({
        error: () => this.performLogout()
      });
    }
  }

  private performLogout(): void {
    if (this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unsubscribe();
    }
    
    this.tokenStorage.clearTokens();
    this.updateAuthState({
      token: null,
      isAuthenticated: false,
      loginInProgress: false,
      error: null
    });
  }

  private updateAuthState(newState: AuthState): void {
    this.authStateSubject.next(newState);
  }

}
