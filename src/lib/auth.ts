export interface UserSession {
  username: string;
  name: string;
  isLoggedIn: boolean;
  loginTime: string;
}

const AUTH_STORAGE_KEY = 'polymer_auth_session_v2';
const CREDENTIALS_KEY = 'polymer_custom_credentials_v2';

export const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: 'stock@admin2026',
};

export function getStoredCredentials(): { username: string; password: string } {
  if (typeof window === 'undefined') return DEFAULT_CREDENTIALS;
  try {
    const custom = localStorage.getItem(CREDENTIALS_KEY);
    if (custom) {
      return JSON.parse(custom);
    }
  } catch (e) {}
  return DEFAULT_CREDENTIALS;
}

export function saveStoredCredentials(username: string, password: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ username, password }));
}

export function getCurrentSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionStr = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!sessionStr) return null;
    const session: UserSession = JSON.parse(sessionStr);
    return session.isLoggedIn ? session : null;
  } catch {
    return null;
  }
}

export async function serverLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const customCredentials = getStoredCredentials();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, customCredentials }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Invalid credentials' };
    }

    if (typeof window !== 'undefined') {
      const session: UserSession = {
        username: data.user.username,
        name: data.user.name,
        isLoggedIn: true,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Network error or connection failed.' };
  }
}

export async function serverLogout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
