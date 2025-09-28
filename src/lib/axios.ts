import { fetchCsrfTokenApi } from "@/modules/auth/api";
import { RefreshApi } from "@/routes/api";
import axios from "axios";
import Cookies from "js-cookie";

// ===== TOKEN GETTERS =====
let getAccessToken: (() => string | null) | null = null;
let getCsrfToken: (() => string | null) | null = null;

export const setAccessTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

export const setCsrfTokenGetter = (getter: () => string | null) => {
  getCsrfToken = getter;
};

// ===== AXIOS INSTANCE =====
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
  withCredentials: true, // cookies-এর জন্য গুরুত্বপূর্ণ
});

// ===== CSRF INIT FUNCTION =====
export const initCsrf = async () => {
  try {
    const response = await fetchCsrfTokenApi();
    const token = response.csrfToken || Cookies.get("XSRF-TOKEN") || null;

    if (token) {
      setCsrfTokenGetter(() => token);
      api.defaults.headers.common["X-CSRF-TOKEN"] = token;
    }
  } catch (err) {
    console.error("Failed to init CSRF token:", err);
  }
};

// ===== REQUEST INTERCEPTOR =====
api.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  // JWT attach করা
  const token = getAccessToken?.();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // CSRF attach করা unsafe methods-এর জন্য
  const csrfToken = getCsrfToken?.();
  if (
    csrfToken &&
    ["post", "put", "patch", "delete"].includes((config.method || "").toLowerCase())
  ) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }

  return config;
});

// ===== REFRESH TOKEN HANDLING =====
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

const handleLogout = () => window.dispatchEvent(new Event("logout"));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;

    // 401 → refresh token try
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      document.cookie.includes("refreshToken")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
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
        // CSRF attach করা
        const csrfToken = getCsrfToken?.();
        const headers: Record<string, string> = {};
        if (csrfToken) headers["X-CSRF-TOKEN"] = csrfToken;

        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + "/api"+RefreshApi.url,
          {},
          { withCredentials: true, headers }
        );

        const newToken = response.data.accessToken;
        processQueue(null, newToken);

        // Redux বা token getter update করা উচিত
        if (getAccessToken) setAccessTokenGetter(() => newToken);

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
