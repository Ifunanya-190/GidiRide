import type { User } from '../types/user';

export const TOKEN_KEY = 'gidiride.token';
export const USER_KEY = 'gidiride.user';

export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function persistSession(token: string, user: User) {
  // sessionStorage keeps each browser tab independent, so Admin/Rider/Driver test tabs don't overwrite each other.
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));

  // localStorage remains as a soft fallback for single-tab refreshes and old helper functions.
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateSessionUser(user: User) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Sync logout across browser tabs via storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY && event.newValue === null) {
      // Another tab logged out — reload to clear state
      window.location.replace('/login');
    }
  });
}
