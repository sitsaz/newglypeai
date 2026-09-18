/**
 * Stealth URL Cipher (TypeScript version)
 * Compatible with php-package/includes/StealthCipher.php
 * Reversible URL obfuscation using URL-Safe Base64 and XOR salt.
 */

const DEFAULT_KEY = 'cp_vault_key';

export class StealthCipher {
  static encode(url: string, key = DEFAULT_KEY): string {
    if (!url) return '';
    const k = key || DEFAULT_KEY;
    const buf = Buffer.from(url, 'utf-8');
    const out = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
      out[i] = buf[i] ^ k.charCodeAt(i % k.length);
    }
    const b64 = out.toString('base64');
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
      const raw = Buffer.from(b64, 'base64');
      const out = Buffer.alloc(raw.length);
      for (let i = 0; i < raw.length; i++) {
        out[i] = raw[i] ^ k.charCodeAt(i % k.length);
      }
      const decoded = out.toString('utf-8');
      if (/^https?:\/\//i.test(decoded)) {
        return decoded;
      }

      // Check if standard un-salted base64 was passed
      const plain = raw.toString('utf-8');
      if (/^https?:\/\//i.test(plain)) {
        return plain;
      }
      return decoded;
    } catch (e) {
      return encoded;
    }
  }
}
