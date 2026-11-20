import axios from 'axios';

/**
 * FarmConnect Central Axios API Client
 * Configured with base URL, automatic JWT bearer attachment,
 * and robust, concurrency-safe access-token refresh on 401.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Queue to hold requests while a token refresh is in progress
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach JWT bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // For FormData payloads, let the browser/Axios calculate the multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Concurrency-safe automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401, or is from auth endpoints (login/refresh), or already retried, reject immediately
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('auth/login') ||
      originalRequest.url?.includes('auth/token/refresh')
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');

    // If no refresh token exists, clear session and reject
    if (!refreshToken) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      window.dispatchEvent(new Event('farmconnect:logout'));
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If refresh is already in progress, enqueue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Use clean axios call directly to avoid interceptor recursion
      const refreshResponse = await axios.post(`${API_BASE_URL}auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access, refresh: newRefresh } = refreshResponse.data;

      if (access) {
        localStorage.setItem('access_token', access);
        if (newRefresh) {
          localStorage.setItem('refresh_token', newRefresh);
        }

        api.defaults.headers.common.Authorization = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;

        processQueue(null, access);
        return api(originalRequest);
      } else {
        throw new Error('Refresh response missing access token');
      }
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      window.dispatchEvent(new Event('farmconnect:logout'));
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
