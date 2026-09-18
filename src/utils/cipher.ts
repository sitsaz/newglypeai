/**
 * Browser-safe Stealth URL Cipher
 * Compatible with StealthCipher in PHP and Server Node.js
 */

const DEFAULT_KEY = 'cp_vault_key';

export class StealthCipher {
  static encode(url: string, key = DEFAULT_KEY): string {
    if (!url) return '';
    const k = key || DEFAULT_KEY;
    const utf8Bytes = new TextEncoder().encode(url);
    const xored = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      xored[i] = utf8Bytes[i] ^ k.charCodeAt(i % k.length);
    }
    let binary = '';
    for (let i = 0; i < xored.length; i++) {
      binary += String.fromCharCode(xored[i]);
    }
    const b64 = btoa(binary);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  static decode(encoded: string, key = DEFAULT_KEY): string {
    if (!encoded) return '';
    if (/^https?:\/\//i.test(encoded)) {
      return encoded;
    }
    const k = key || DEFAULT_KEY;
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) {
      b64 += '='.repeat(4 - pad);
    }

    try {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i) ^ k.charCodeAt(i % k.length);
      }
      const decoded = new TextDecoder().decode(bytes);
      if (/^https?:\/\//i.test(decoded)) {
        return decoded;
      }
      // Try raw un-salted base64
      const rawBinary = atob(b64);
      const rawBytes = new Uint8Array(rawBinary.length);
      for (let i = 0; i < rawBinary.length; i++) {
        rawBytes[i] = rawBinary.charCodeAt(i);
      }
      const plain = new TextDecoder().decode(rawBytes);
      if (/^https?:\/\//i.test(plain)) {
        return plain;
      }
      return decoded;
    } catch (e) {
      return encoded;
    }
  }
}
