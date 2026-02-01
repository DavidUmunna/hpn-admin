import type { ApiErrorPayload } from './types';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
  // Clear, actionable console message to avoid silent "undefined/..." requests
  // which resolve as relative URLs to the frontend server.
  // Developers: set VITE_API_URL in .env and restart the dev server.
  // We keep a safe empty string so runtime code doesn't crash, but we warn loudly.
  // Example .env: VITE_API_URL=http://localhost:4000/api
  // Note: Vite only exposes env variables prefixed with VITE_.
  // eslint-disable-next-line no-console
  console.error(
    'VITE_API_URL is not set. Requests will be sent to the frontend origin.\nSet VITE_API_URL in .env (prefixed with VITE_) and restart the dev server.'
  );
}

export const API_BASE_URL = (rawApiUrl ?? '').replace(/\/\/+$/, '');

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const payload = data as ApiErrorPayload | null;
    const message = payload?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload?.details);
  }

  return (data ?? ({} as T)) as T;
}
