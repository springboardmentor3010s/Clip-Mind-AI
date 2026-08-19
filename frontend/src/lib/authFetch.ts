import { API_BASE_URL } from '@/config';

/**
 * fetch() wrapper that attaches the logged-in user's bearer token, if any.
 * Reads directly from localStorage (rather than requiring useAuth()) so it
 * can be used from any component or plain module without threading the
 * token through props.
 */
export function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  return fetch(url, { ...options, headers });
}
