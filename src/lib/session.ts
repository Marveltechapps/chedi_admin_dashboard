const ACCESS_KEY = 'chedi.admin.accessToken';
const REFRESH_KEY = 'chedi.admin.refreshToken';
const STAFF_KEY = 'chedi.admin.staff';

export interface StoredStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  initial: string;
  scope?: string;
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredStaff(): StoredStaff | null {
  try {
    const raw = sessionStorage.getItem(STAFF_KEY);
    return raw ? (JSON.parse(raw) as StoredStaff) : null;
  } catch {
    return null;
  }
}

export function saveSession(accessToken: string, refreshToken: string, staff: StoredStaff) {
  sessionStorage.setItem(ACCESS_KEY, accessToken);
  sessionStorage.setItem(REFRESH_KEY, refreshToken);
  sessionStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

export function saveAccessToken(accessToken: string) {
  sessionStorage.setItem(ACCESS_KEY, accessToken);
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(STAFF_KEY);
}
