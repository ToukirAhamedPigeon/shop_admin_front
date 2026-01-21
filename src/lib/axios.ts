import { RefreshApi } from "@/routes/api";
import axios from "axios";
// import { dispatchShowToast } from "./dispatch";

// ===== ENV CONFIG =====
// ⬆️ set in .env → VITE_AUTH_TYPE=sanctum or jwt

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
  withCredentials: true, // for cookies (Sanctum & refresh token JWT)
});

// ===== CSRF INIT FUNCTION (Sanctum only) =====


// ===== REQUEST INTERCEPTOR =====
api.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  // === JWT mode → attach Authorization header ===
    const token = getAccessToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;


  return config;
});

// ===== REFRESH TOKEN HANDLING (JWT only) =====
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

    // Only handle refresh for JWT
    if (error.response?.status === 401 &&
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
        const csrfToken = getCsrfToken?.();
        const headers: Record<string, string> = {};
        if (csrfToken) headers["X-CSRF-TOKEN"] = csrfToken;

        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + "/api" + RefreshApi.url,
          {},
          { withCredentials: true, headers }
        );

        const newToken = response.data.accessToken;
        processQueue(null, newToken);

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
    if (error.response?.status === 403) {
      console.log(error.response?.data?.message ||
        error.response?.data?.error ||
        "You do not have permission to perform this action");
      //   dispatchShowToast({
      //     type: "danger",
      //     message:
      //       error.response?.data?.message ||
      //       error.response?.data?.error ||
      //       "You do not have permission to perform this action",
      // });
    }
    return Promise.reject(error);
  }
);

export default api;
