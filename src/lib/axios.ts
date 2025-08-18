// axios.ts
import axios from "axios";

// ---------------------------
// Step 1: Create a variable to hold a function that returns the access token from Redux state
// ---------------------------
let getAccessToken: (() => string | null) | null = null;

// ---------------------------
// Step 2: Export a function to set the access token getter
// This will be called in your app entry point (e.g., main.tsx) after store is created
// ---------------------------
export const setAccessTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

// ---------------------------
// Step 3: Create Axios instance
// - baseURL is set from environment variable
// - withCredentials allows sending HttpOnly cookies (refresh token)
// ---------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
  withCredentials: true,
});

// ---------------------------
// Step 4: Axios request interceptor
// Before sending any request, attach Authorization header if access token exists
// ---------------------------
api.interceptors.request.use((config) => {
  if (getAccessToken) {
    const token = getAccessToken(); // call getter to get latest Redux access token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`; // attach token to request
    }
  }
  return config; // always return config
});

// ---------------------------
// Step 5: Handle 401 responses (token expired)
// Retry failed requests with refresh token
// ---------------------------
let isRefreshing = false; // prevent multiple simultaneous refresh calls
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  // Resolve or reject all queued requests waiting for token
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = []; // clear queue
};

// Custom logout handler
const handleLogout = () => {
  // Dispatch a global logout event, your React app can listen and clear Redux state
  window.dispatchEvent(new Event("logout"));
};

// ---------------------------
// Step 6: Axios response interceptor
// ---------------------------
api.interceptors.response.use(
  (response) => response, // if response is successful, just return
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors (unauthorized) and retry once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // mark request as retried

      if (isRefreshing) {
        // If a refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // After refresh, retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark that refresh token request is in progress
      isRefreshing = true;

      try {
        // ---------------------------
        // Call refresh token API (HttpOnly cookie is sent automatically)
        // ---------------------------
        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + "/api/auth/refresh",
          {},
          { withCredentials: true } // ensure cookie is sent
        );

        const newToken = response.data.accessToken;

        // Queue any pending requests
        processQueue(null, newToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        // If refresh failed, reject queued requests and trigger logout
        processQueue(err, null);
        handleLogout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false; // reset
      }
    }

    // If error is not 401, just reject
    return Promise.reject(error);
  }
);

export default api;
