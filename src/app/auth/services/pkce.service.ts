import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PkceService {
  private readonly CODE_VERIFIER_KEY = 'pkce_code_verifier';

  constructor() { }

  /**
   * Generates a random PKCE code verifier (43-128 characters, unreserved characters)
   */
  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  /**
   * Generates a code challenge from the code verifier using SHA-256
   */
  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(hash));
  }

  /**
   * Stores the code verifier in session storage
   */
  storeCodeVerifier(codeVerifier: string): void {
    sessionStorage.setItem(this.CODE_VERIFIER_KEY, codeVerifier);
  }

  /**
   * Retrieves the code verifier from session storage
   */
  retrieveCodeVerifier(): string | null {
    return sessionStorage.getItem(this.CODE_VERIFIER_KEY);
  }

  /**
   * Clears the stored code verifier
   */
  clearCodeVerifier(): void {
    sessionStorage.removeItem(this.CODE_VERIFIER_KEY);
  }

  /**
   * Base64 URL encodes a Uint8Array
   */
  private base64UrlEncode(buffer: Uint8Array): string {
    const binary = String.fromCharCode(...buffer);
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
