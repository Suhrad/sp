import { cookies } from 'next/headers';

const SECRET_KEY = process.env.AUTH_SECRET || 'polymer-enterprise-stock-secret-key-2026-secure-token';
export const SESSION_COOKIE_NAME = 'stock_os_auth_token';

// Simple HMAC SHA-256 signature using standard Web Crypto API (works in Edge and Node)
export async function createSessionToken(username: string): Promise<string> {
  const enc = new TextEncoder();
  const timestamp = Date.now().toString();
  const payload = `${username}:${timestamp}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${payload}.${signatureHex}`;
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payload, expectedSignature] = parts;
    const [username, timestampStr] = payload.split(':');
    if (!username || !timestampStr) return null;

    // Optional expiration (30 days)
    const timestamp = parseInt(timestampStr, 10);
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) return null;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = new Uint8Array(
      expectedSignature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
    return isValid ? username : null;
  } catch (err) {
    return null;
  }
}
