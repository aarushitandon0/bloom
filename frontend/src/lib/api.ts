// ── Bloom API client ─────────────────────────────────────────
// Typed fetch wrapper that attaches the Supabase JWT to every request
// and surfaces backend errors cleanly.
//
// Usage:
//   import { api } from '@/lib/api';
//   const { tiles } = await api.get('/garden');
//   const { tile }  = await api.post('/garden/tile', { tile_type: 'rose', ... });

import { supabase } from '@/lib/supabase';

const BASE = import.meta.env.VITE_API_URL ?? '';

// ── Error class ───────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** True when the backend returned guest_action_blocked */
  get isGuestBlocked() {
    return this.code === 'guest_action_blocked';
  }
}

// ── Core fetch wrapper ────────────────────────────────────────
async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  // Always attach the current session token (works for anon + full users)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.error ?? 'UNKNOWN_ERROR',
      json.message ?? json.error ?? `Request failed: ${res.status}`,
    );
  }

  return json as T;
}

// ── Convenience methods ───────────────────────────────────────
export const api = {
  get:    <T>(path: string)                   => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown)   => request<T>('POST',   path, body),
  patch:  <T>(path: string, body?: unknown)   => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                   => request<T>('DELETE', path),
} as const;

// ── Typed endpoint helpers ────────────────────────────────────
// These mirror the backend route contracts exactly.

export const authApi = {
  me:      () => api.get<{ user: { id: string; email: string | null; isAnonymous: boolean }; profile: unknown }>('/auth/me'),
  signOut: () => api.post<{ ok: boolean }>('/auth/signout'),
};

export const gardenApi = {
  getTiles:     ()                   => api.get<{ tiles: unknown[] }>('/garden'),
  getPublic:    (userId: string)     => api.get<{ profile: unknown; tiles: unknown[] }>(`/garden/public/${userId}`),
  placeTile:    (body: unknown)      => api.post<{ tile: unknown }>('/garden/tile', body),
  editTile:     (id: string, b: unknown) => api.patch<{ tile: unknown }>(`/garden/tile/${id}`, b),
  deleteTile:   (id: string)         => api.delete<{ ok: boolean }>(`/garden/tile/${id}`),
  waterTile:    (id: string)         => api.post<{ tile: unknown; upgraded: boolean }>(`/garden/tile/${id}/water`),
};

export const moodApi = {
  getEntries: ()           => api.get<{ entries: unknown[] }>('/mood'),
  logMood:    (b: unknown) => api.post<{ entry: unknown }>('/mood', b),
  deleteEntry:(id: string) => api.delete<{ ok: boolean }>(`/mood/${id}`),
};

export const kindnessApi = {
  getUnread: ()           => api.get<{ events: unknown[] }>('/kindness'),
  send:      (b: unknown) => api.post<{ event: unknown }>('/kindness', b),
  markRead:  (id: string) => api.post<{ ok: boolean }>(`/kindness/${id}/read`),
};

export const profileApi = {
  get:       ()           => api.get<{ profile: unknown }>('/profile'),
  update:    (b: unknown) => api.patch<{ profile: unknown }>('/profile', b),
  getWorld:  ()           => api.get<{ gardens: unknown[] }>('/profile/world'),
};

export const coGardenApi = {
  list:       ()              => api.get<{ coGardens: unknown[] }>('/co-garden'),
  invite:     ()              => api.post<{ code: string }>('/co-garden/invite'),
  join:       (code: string)  => api.post<{ coGarden: unknown }>(`/co-garden/join/${code}`),
  leave:      (id: string)    => api.delete<{ ok: boolean }>(`/co-garden/${id}`),
};
