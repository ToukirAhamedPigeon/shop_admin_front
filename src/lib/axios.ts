// axios.ts
import axios from "axios";
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// ============================================================
// STEP 1: Access Token & CSRF Token Getter
// - Injected from your app (Redux, Zustand, etc.)
// ============================================================
let getAccessToken: (() => string | null) | null = null;
let getCsrfToken: (() => string | null) | null = null;

/**
 * Set the access token getter (injected from Redux/Zustand).
 */
export const setAccessTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

/**
 * Set the CSRF token getter (if you store CSRF token in Redux/Zustand).
 */
export const setCsrfTokenGetter = (getter: () => string | null) => {
  getCsrfToken = getter;
};

// ============================================================
// STEP 2: Create Axios Instance
// ============================================================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
  withCredentials: true, // needed for refreshToken & CSRF cookies
});

// ============================================================
// STEP 3: Request Interceptor
// ============================================================
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Attach access token
  if (getAccessToken) {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Attach CSRF token
  if (getCsrfToken) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-TOKEN"] = csrfToken;
    }
  }

  return config;
});

// ============================================================
// STEP 4: Refresh Token Handling
// ============================================================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

/**
 * Process queued requests after refresh.
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

/**
 * Trigger global logout event.
 */
const handleLogout = () => {
  window.dispatchEvent(new Event("logout"));
};

// ============================================================
// STEP 5: Response Interceptor
// ============================================================
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Call refresh endpoint (cookie-based refresh)
        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + "/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newToken = response.data.accessToken;

        // Notify queued requests
        processQueue(null, newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        handleLogout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
