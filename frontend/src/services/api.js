/**
 * Axios API instance
 * - In development: baseURL = '/api'  (Vite proxy forwards to localhost:5000)
 * - In production:  baseURL = VITE_API_URL + '/api'  (Render/Railway backend URL)
 *
 * VITE_API_URL must be the bare backend origin, e.g.:
 *   https://task-manager-for-ethara-ai.onrender.com
 *   (no trailing slash, no /api suffix)
 */

import axios from 'axios';

// Strip any accidental trailing slash or /api suffix from the env var
// so we never end up with double-slashes or /api/api in the URL.
const rawUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');

const BASE = rawUrl ? `${rawUrl}/api` : '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
