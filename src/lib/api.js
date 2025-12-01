// Small API helper to switch between local server and Vercel serverless
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiFetch = async (path, options = {}) => {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, options);
  // Try to parse JSON; if it fails, throw text for better diagnostics
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
};
