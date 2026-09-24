import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 204) {
    return null;
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // If token is invalid or expired (401), clear invalid session
    if (res.status === 401) {
      supabase.auth.signOut().catch(() => {});
    }
    throw new ApiError(
      res.status,
      json?.error?.code || 'request_failed',
      json?.error?.message || 'Request failed'
    );
  }

  return json;
}
