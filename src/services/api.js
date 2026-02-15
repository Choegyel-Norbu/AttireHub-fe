import axios from 'axios';

// Ensure base URL ends with /api/v1 (backend expects this prefix)
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';
if (!API_BASE_URL.endsWith('/api/v1')) {
  API_BASE_URL = API_BASE_URL.replace(/\/?$/, '') + '/api/v1';
}

const isNgrokUrl = /ngrok-free\.app|ngrok\.io/.test(API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(isNgrokUrl && { 'ngrok-skip-browser-warning': 'true' }),
  },
});

// Request interceptor: Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    if (isNgrokUrl) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Return response body; handle 401 only for protected requests
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const isAuthRequest = /\/auth\/(login|register|verify-email)$/.test(error.config?.url ?? '');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403 && !isAuthRequest) {
      console.error('Access forbidden');
    }
    return Promise.reject(error);
  }
);
