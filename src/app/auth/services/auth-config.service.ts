import { Injectable } from '@angular/core';
import { AuthConfiguration } from '../../authtypes';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthConfigService {

  private readonly config: AuthConfiguration;

  constructor() {
    this.config = {
      clientId: environment.ibabsAuthClientId,
      authorizationEndpoint: `${environment.ibabsAuthBaseUrl}/OAuth/Authorize`,
      tokenEndpoint: `${environment.ibabsAuthBaseUrl}/OAuth/Token`,
      redirectUri: `${window.location.origin}/`,
      deviceKey: this.getOrCreateDeviceKey(environment.ibabsAuthDeviceKey),
      tokenExpiresIn: environment.tokenExpiresIn,
      refreshTokenExpiresIn: environment.refreshTokenExpiresIn,
    };
  }

  getConfig(): AuthConfiguration {
    return { ...this.config };
  }

  getOrCreateDeviceKey(configKey: string): string {
    const storageKey = `device_key_${configKey}`;
    let deviceKey = sessionStorage.getItem(storageKey);
    
    if (!deviceKey) {
      deviceKey = this.generateUuid();
      sessionStorage.setItem(storageKey, deviceKey);
    }
    
    return deviceKey;
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

}
