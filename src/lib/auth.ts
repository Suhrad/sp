export interface UserSession {
  username: string;
  name: string;
  isLoggedIn: boolean;
  loginTime: string;
}

const AUTH_STORAGE_KEY = 'polymer_auth_session_v1';
const CREDENTIALS_KEY = 'polymer_custom_credentials_v1';

// Default initial credentials (user can change in Settings)
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
  } catch (e) {
    // fallback
  }
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

export function setSession(username: string, name: string = 'Owner / Admin') {
  if (typeof window === 'undefined') return;
  const session: UserSession = {
    username,
    name,
    isLoggedIn: true,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  // also set a cookie so next server/client can read if needed
  document.cookie = `polymer_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = 'polymer_session=; path=/; max-age=0; SameSite=Lax';
}

export function verifyLogin(user: string, pass: string): boolean {
  const creds = getStoredCredentials();
  return (
    user.trim().toLowerCase() === creds.username.toLowerCase() &&
    pass === creds.password
  );
}
