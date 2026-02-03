import { ChangeDetectionStrategy, Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenStorageService } from '../auth/services/token-storage.service';
import { AuthConfigService } from '../auth/services/auth-config.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-show-token',
  imports: [CommonModule],
  templateUrl: './ShowToken.html',
  styleUrl: './ShowToken.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowToken implements OnInit {
  token = signal<string | null>(null);
  deviceId = signal<string | null>(null);
  tokenCopied = signal(false);
  deviceIdCopied = signal(false);

  constructor(
    private tokenStorage: TokenStorageService,
    private authConfig: AuthConfigService
  ) {}

  ngOnInit(): void {
    // Get the access token
    const accessToken = this.tokenStorage.getAccessToken();
    this.token.set(accessToken);

    // Get the device ID from config
    const config = this.authConfig.getOrCreateDeviceKey(environment.ibabsAuthDeviceKey);
    this.deviceId.set(config);
  }

  async copyToken(): Promise<void> {
    const tokenValue = this.token();
    if (tokenValue) {
      try {
        await navigator.clipboard.writeText(tokenValue);
        this.tokenCopied.set(true);
        setTimeout(() => this.tokenCopied.set(false), 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    }
  }

  async copyDeviceId(): Promise<void> {
    const deviceIdValue = this.deviceId();
    if (deviceIdValue) {
      try {
        await navigator.clipboard.writeText(deviceIdValue);
        this.deviceIdCopied.set(true);
        setTimeout(() => this.deviceIdCopied.set(false), 2000);
      } catch (err) {
        console.error('Failed to copy device ID:', err);
      }
    }
  }
}
