import { clearSession, getAccessToken, getRefreshToken, saveAccessToken, saveSession } from './session';
import type { StoredStaff } from './session';
import { networkErrorMessage, resolveApiBase } from './apiBase';

function apiBase() {
  return resolveApiBase();
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: { field?: string; message?: string }[];

  constructor(status: number, code: string, message: string, details: { field?: string; message?: string }[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiResult<T> {
  data: T;
  message?: string;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  meta?: Record<string, unknown>;
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  idempotent?: boolean;
  skipAuth?: boolean;
  raw?: boolean;
  headers?: Record<string, string>;
}

function requestId() {
  return crypto.randomUUID();
}

function withQuery(path: string, query?: RequestOpts['query']) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === '') continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${apiBase()}/admin/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId() },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) return false;
      const accessToken = json.data?.accessToken;
      const nextRefresh = json.data?.refreshToken;
      const staff = json.data?.staff as StoredStaff | undefined;
      if (!accessToken || !nextRefresh) return false;
      if (staff) saveSession(accessToken, nextRefresh, staff);
      else saveAccessToken(accessToken);
      if (nextRefresh) sessionStorage.setItem('chedi.admin.refreshToken', nextRefresh);
      return true;
    } catch {
      return false;
    }
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function throwFromBody(res: Response, json: Record<string, unknown> | null): never {
  const err = (json?.error || {}) as { code?: string; message?: string; details?: { field?: string; message?: string }[] };
  const message =
    err.message ||
    (typeof json?.message === 'string' ? json.message : null) ||
    res.statusText ||
    'Request failed';
  throw new ApiError(res.status, err.code || 'ERROR', message, Array.isArray(err.details) ? err.details : []);
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOpts = {}): Promise<ApiResult<T>> {
  const url = `${apiBase()}${withQuery(path, opts.query)}`;
  const headers: Record<string, string> = {
    'X-Request-Id': requestId(),
    ...(opts.headers || {}),
  };
  if (!opts.raw) headers['Content-Type'] = 'application/json';
  if (!opts.skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (opts.idempotent) headers['Idempotency-Key'] = crypto.randomUUID();

  const exec = async () => {
    try {
      return await fetch(url, {
        method: opts.method || 'GET',
        headers,
        body: opts.body == null ? undefined : JSON.stringify(opts.body),
      });
    } catch {
      throw new ApiError(0, 'NETWORK_ERROR', networkErrorMessage());
    }
  };

  let res = await exec();
  if (res.status === 401 && !opts.skipAuth && !path.endsWith('/admin/login') && !path.endsWith('/admin/refresh')) {
    const ok = await tryRefresh();
    if (ok) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      if (opts.idempotent) headers['Idempotency-Key'] = crypto.randomUUID();
      res = await exec();
    } else {
      clearSession();
    }
  }

  if (opts.raw) {
    if (!res.ok) {
      const json = await parseJson(res);
      throwFromBody(res, json);
    }
    return { data: res as unknown as T };
  }

  const json = await parseJson(res);
  if (!res.ok || json?.success === false) throwFromBody(res, json);
  return {
    data: (json?.data ?? json) as T,
    message: json?.message,
    pagination: json?.pagination,
    meta: json?.meta,
  };
}

export const api = {
  get: <T>(path: string, query?: RequestOpts['query']) => apiRequest<T>(path, { query }),
  post: <T>(path: string, body?: unknown, extra?: Pick<RequestOpts, 'idempotent' | 'skipAuth'>) =>
    apiRequest<T>(path, { method: 'POST', body, ...extra }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
};

export async function downloadCsv(path: string, query?: RequestOpts['query']) {
  const result = await apiRequest<Response>(path, { query, raw: true });
  const res = result.data;
  const blob = await res.blob();
  const disp = res.headers.get('Content-Disposition') || '';
  const match = disp.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || 'chedi-report.csv';
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export function errorMessage(err: unknown, fallback = 'Something went wrong') {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
