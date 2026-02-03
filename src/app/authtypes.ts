export interface AuthConfiguration {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  deviceKey: string;
  tokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loginInProgress: boolean;
  error: string | null;
}