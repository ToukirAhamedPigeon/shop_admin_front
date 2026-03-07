import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { RefreshApi } from "@/routes/api";

// ================= TOKEN GETTERS =================

let getAccessToken: (() => string | null) | null = null;
let getCsrfToken: (() => string | null) | null = null;
let onLogout: (() => void) | null = null;
let onRefreshSuccess: ((token: string) => void) | null = null;

export const setAccessTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

export const setCsrfTokenGetter = (getter: () => string | null) => {
  getCsrfToken = getter;
};

export const setLogoutHandler = (handler: () => void) => {
  onLogout = handler;
};

export const setRefreshSuccessHandler = (handler: (token: string) => void) => {
  onRefreshSuccess = handler;
};

// ================= AXIOS INSTANCE =================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
  withCredentials: true,
});

// ================= REQUEST INTERCEPTOR =================

api.interceptors.request.use((config) => {

  config.headers = config.headers || {};

  const token = getAccessToken?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrfToken = getCsrfToken?.();
  if (csrfToken) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }

  return config;
});

// ================= REFRESH STATE =================

let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

// ================= QUEUE PROCESSOR =================

const processQueue = (error: any, token: string | null = null) => {

  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });

  failedQueue = [];
};

// ================= RESPONSE INTERCEPTOR =================

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Only handle 401
    if (error.response?.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;

      // ================= MULTIPLE REQUEST HANDLING =================

      if (isRefreshing) {

        return new Promise<string>((resolve, reject) => {

          failedQueue.push({ resolve, reject });

        })
          .then((token) => {

            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${token}`,
            };

            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {

        const csrfToken = getCsrfToken?.();

        const headers: Record<string, string> = {};

        if (csrfToken) {
          headers["X-CSRF-TOKEN"] = csrfToken;
        }

        // IMPORTANT: use plain axios (not api instance)
        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + "/api" + RefreshApi.url,
          {},
          {
            withCredentials: true,
            headers,
          }
        );

        const newToken = response.data.accessToken;

        // Update store
        onRefreshSuccess?.(newToken);

        // Resolve queued requests
        processQueue(null, newToken);

        // Retry original request
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };

        return api(originalRequest);

      } catch (err) {

        processQueue(err, null);

        onLogout?.();

        return Promise.reject(err);

      } finally {

        isRefreshing = false;

      }
    }

    return Promise.reject(error);
  }
);

export default api;