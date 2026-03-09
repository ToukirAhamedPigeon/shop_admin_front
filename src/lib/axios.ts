import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { RefreshApi, FetchCsrfTokenApi } from "@/routes/api";

// ================= TOKEN GETTERS =================

let getAccessToken: (() => string | null) | null = null;
let getCsrfToken: (() => string | null) | null = null;
let onLogout: (() => void) | null = null;
let onRefreshSuccess: ((token: string) => void) | null = null;

export const setAccessTokenGetter = (getter: () => string | null) => {
  //console.log("Setting access token getter");
  getAccessToken = getter;
};

export const setCsrfTokenGetter = (getter: () => string | null) => {
  //console.log("Setting CSRF token getter");
  getCsrfToken = getter;
};

export const setLogoutHandler = (handler: () => void) => {
  //console.log("Setting logout handler");
  onLogout = handler;
};

export const setRefreshSuccessHandler = (handler: (token: string) => void) => {
  //console.log("Setting refresh success handler");
  onRefreshSuccess = handler;
};

// ================= AXIOS INSTANCE =================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
  withCredentials: true,
});

// ================= REQUEST INTERCEPTOR =================

api.interceptors.request.use((config) => {
  //console.log("Request interceptor - URL:", config.url);
  
  config.headers = config.headers || {};

  const token = getAccessToken?.();
  if (token) {
    //console.log("Adding access token to request");
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    //console.log("No access token available");
  }

  const csrfToken = getCsrfToken?.();
  if (csrfToken) {
    //console.log("Adding CSRF token to request");
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  } else {
    //console.log("No CSRF token available");
  }

  return config;
});

// ================= REFRESH STATE =================

let isRefreshing = false;
let isRefreshingCsrf = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

let csrfFailedQueue: {
  resolve: () => void;
  reject: (error: any) => void;
}[] = [];

// ================= QUEUE PROCESSORS =================

const processQueue = (error: any, token: string | null = null) => {
  //console.log("Processing token queue, error:", error, "token:", token);
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

const processCsrfQueue = (error: any) => {
  //console.log("Processing CSRF queue, error:", error);
  csrfFailedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  csrfFailedQueue = [];
};

// ================= RESPONSE INTERCEPTOR =================

api.interceptors.response.use(
  (response) => {
    //console.log("Response success - URL:", response.config.url, "Status:", response.status);
    return response;
  },

  async (error: AxiosError) => {
    //console.log("Response error - URL:", error.config?.url, "Status:", error.response?.status);
    //console.log("Error message:", error.message);
    //console.log("Error response data:", error.response?.data);

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _csrfRetry?: boolean };

    if (!originalRequest) {
      //console.log("No original request, rejecting");
      return Promise.reject(error);
    }

    // ================= HANDLE 403 CSRF ERRORS =================
    if (error.response?.status === 403 && !originalRequest._csrfRetry) {
      //console.log("=== CSRF ERROR DETECTED ===");
      //console.log("Request URL:", originalRequest.url);
      //console.log("Request method:", originalRequest.method);
      
      // Check if it's a CSRF error
      const responseData = error.response?.data as any;
      const isCsrfError = 
        responseData?.message?.toLowerCase().includes('csrf') ||
        responseData?.title?.toLowerCase().includes('csrf') ||
        error.message?.toLowerCase().includes('csrf') ||
        responseData?.toString().toLowerCase().includes('csrf');

      //console.log("Is CSRF error:", isCsrfError);
      
      // For login endpoint, always try to refresh CSRF token on 403
      const isLoginEndpoint = originalRequest.url?.includes('login');
      //console.log("Is login endpoint:", isLoginEndpoint);

      if (isCsrfError || isLoginEndpoint) {
        //console.log("Attempting CSRF token refresh");
        originalRequest._csrfRetry = true;

        // Handle multiple CSRF refresh requests
        if (isRefreshingCsrf) {
          //console.log("CSRF refresh already in progress, queueing request");
          return new Promise<void>((resolve, reject) => {
            csrfFailedQueue.push({ resolve, reject });
          })
            .then(() => {
              //console.log("CSRF queue resolved, retrying original request");
              const newCsrfToken = getCsrfToken?.();
              if (newCsrfToken) {
                originalRequest.headers = {
                  ...(originalRequest.headers || {}),
                  "X-CSRF-TOKEN": newCsrfToken,
                };
              }
              return api(originalRequest);
            })
            .catch((err) => {
              //console.log("CSRF queue rejected:", err);
              return Promise.reject(err);
            });
        }

        isRefreshingCsrf = true;
        //console.log("Starting CSRF token refresh");

        try {
          // Fetch new CSRF token
          //console.log("Fetching new CSRF token from:", FetchCsrfTokenApi.url);
          const response = await axios.get(
            import.meta.env.VITE_API_BASE_URL + "/api" + FetchCsrfTokenApi.url,
            {
              withCredentials: true,
            }
          );

          //console.log("CSRF token response:", response.data);
          const newCsrfToken = response.data?.csrfToken;

          if (newCsrfToken) {
            //console.log("New CSRF token received:", newCsrfToken);
            // Update the token in headers
            api.defaults.headers.common["X-CSRF-TOKEN"] = newCsrfToken;
            
            // Update the token in the original request
            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              "X-CSRF-TOKEN": newCsrfToken,
            };
          } else {
            //console.log("No CSRF token in response");
          }

          // Resolve queued requests
          processCsrfQueue(null);

          // Retry original request
          //console.log("Retrying original request with new CSRF token");
          return api(originalRequest);

        } catch (csrfError) {
          //console.log("CSRF token refresh failed:", csrfError);
          processCsrfQueue(csrfError);
          return Promise.reject(csrfError);
        } finally {
          isRefreshingCsrf = false;
          //console.log("CSRF refresh completed");
        }
      }
    }

    // ================= HANDLE 401 TOKEN ERRORS =================
    if (error.response?.status === 401 && !originalRequest._retry) {
      //console.log("=== TOKEN ERROR DETECTED ===");
      //console.log("Request URL:", originalRequest.url);

      originalRequest._retry = true;

      // Handle multiple token refresh requests
      if (isRefreshing) {
        //console.log("Token refresh already in progress, queueing request");
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            //console.log("Token queue resolved, retrying with new token");
            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${token}`,
            };
            return api(originalRequest);
          })
          .catch((err) => {
            //console.log("Token queue rejected:", err);
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      //console.log("Starting token refresh");

      try {
        const csrfToken = getCsrfToken?.();

        const headers: Record<string, string> = {};

        if (csrfToken) {
          headers["X-CSRF-TOKEN"] = csrfToken;
        }

        //console.log("Refreshing token with headers:", headers);
        
        // IMPORTANT: use plain axios (not api instance) to avoid interceptor loop
        const response = await axios.post(
          import.meta.env.VITE_API_BASE_URL + "/api" + RefreshApi.url,
          {},
          {
            withCredentials: true,
            headers,
          }
        );

        //console.log("Token refresh response:", response.data);
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

        //console.log("Retrying original request with new token");
        return api(originalRequest);

      } catch (err) {
        //console.log("Token refresh failed:", err);
        processQueue(err, null);
        onLogout?.();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    //console.log("Unhandled error, rejecting");
    return Promise.reject(error);
  }
);

export default api;