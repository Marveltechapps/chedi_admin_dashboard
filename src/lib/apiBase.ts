/** Shared CHEDI API host used by both the member app and admin dashboard. */
export const SHARED_API_ORIGIN = 'https://api.webapp.chedi.in';
export const SHARED_API_BASE = `${SHARED_API_ORIGIN}/api`;

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isChediHost(hostname: string) {
  return hostname === 'chedi.in' || hostname.endsWith('.chedi.in');
}

function normalizeRemoteApi(url: string) {
  return String(url || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/https?:\/\/api\.dashboard\.chedi\.in/i, SHARED_API_ORIGIN)
    .replace(/https?:\/\/api\.chedi\.in(?![\w.-])/i, SHARED_API_ORIGIN);
}

/**
 * Local Vite always uses same-origin `/api` (dev/preview proxy) so the browser
 * never hits a cross-origin API. Hosted chedi.in apps talk to the shared API.
 */
export function resolveApiBase() {
  const configured = String(import.meta.env.VITE_API_URL || '/api').trim();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (!hostname || isLocalHost(hostname)) {
    return '/api';
  }

  if (/^https?:\/\//i.test(configured)) {
    return normalizeRemoteApi(configured);
  }

  if (isChediHost(hostname)) {
    return SHARED_API_BASE;
  }

  return '/api';
}

export function resolveSocketBase() {
  const explicit = String(import.meta.env.VITE_SOCKET_URL || '').trim();
  if (/^https?:\/\//i.test(explicit)) {
    return normalizeRemoteApi(explicit);
  }
  const api = resolveApiBase();
  if (/^https?:\/\//i.test(api)) {
    return api.replace(/\/api\/v1\/?$/i, '').replace(/\/api\/?$/i, '');
  }
  return undefined;
}

export function networkErrorMessage() {
  return 'Unable to reach the CHEDI API. Confirm the backend is running and reachable.';
}

/** Turn a stored `/uploads/...` path into a URL the browser can load. */
export function mediaUrl(url?: string | null) {
  const raw = String(url || '').trim();
  if (!raw || /^(https?:|data:|blob:)/i.test(raw)) return raw;
  const api = resolveApiBase().replace(/\/+$/, '');
  const origin = api.replace(/\/api\/v1$/i, '').replace(/\/api$/i, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${origin}${path}`;
}
