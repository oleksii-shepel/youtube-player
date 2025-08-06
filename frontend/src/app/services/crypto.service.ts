import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private ENCRYPTION_KEY_ALIAS = 'app-settings-key';
  private IV_LENGTH = 12; // AES-GCM standard IV length

  // Convert string to ArrayBuffer
  strToBuf(str: string): ArrayBuffer {
    return new TextEncoder().encode(str);
  }

  // Convert ArrayBuffer to base64
  bufToBase64(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }

  // Convert base64 to ArrayBuffer
  base64ToBuf(base64: string): ArrayBuffer {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
  }

  // Generate or retrieve an AES-GCM CryptoKey
  async getCryptoKey(): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      this.strToBuf(this.ENCRYPTION_KEY_ALIAS),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.strToBuf('static-salt'), // ideally random and stored
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptData(data: any): Promise<string> {
    const json = JSON.stringify(data);
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const key = await this.getCryptoKey();

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      this.strToBuf(json)
    );

    // Combine IV + encrypted content in base64
    return `${this.bufToBase64(iv.buffer)}:${this.bufToBase64(encrypted)}`;
  }

  async decryptData(encryptedData: string): Promise<any> {
    const [ivBase64, encryptedBase64] = encryptedData.split(':');
    const iv = new Uint8Array(this.base64ToBuf(ivBase64));
    const encrypted = this.base64ToBuf(encryptedBase64);
    const key = await this.getCryptoKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const json = new TextDecoder().decode(decrypted);
    return JSON.parse(json);
  }

  isLikelyEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    // Common patterns: JWT (3 parts with dots), long base64, random characters
    const isJWT = value.split('.').length === 3;
    const isLongAndNonReadable =
      value.length > 30 && /^[A-Za-z0-9+/=_\-]+$/.test(value);

    return isJWT || isLongAndNonReadable;
  }
}
