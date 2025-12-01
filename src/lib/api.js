// Small API helper to switch between local server and Vercel serverless
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiFetch = (path, options = {}) => {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, options);
};
