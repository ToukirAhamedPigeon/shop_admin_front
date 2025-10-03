import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/axios";
import type {User, LoginResponse, RefreshResponse} from "@/modules/auth/types"
import {fetchCsrfTokenApi, loginApi, refreshApi, logoutApi, logoutAllApi, logoutOthersApi} from "@/modules/auth/api"


// =========================
// User & API Response Types
// =========================

// =========================
// Auth State Interface
// =========================
interface AuthState {
  user: User | null;
  accessToken: string | null;
  csrfToken: string | null;
  loading: boolean;
  error: string | null;
  isLoggedOut: boolean; // ✅ Track if user has logged out
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  csrfToken: null,
  loading: false,
  error: null,
  isLoggedOut: false,
};

// =========================
// Async Thunks
// =========================

// Fetch CSRF Token
export const fetchCsrfToken = createAsyncThunk<string>(
  "auth/fetchCsrfToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchCsrfTokenApi();
      const token = response?.csrfToken || null;
      
      if (!token) {
        return rejectWithValue("Failed to fetch CSRF token");
      }
    // ✅ Choose correct header key based on auth type
      api.defaults.headers.common["X-CSRF-TOKEN"] = token;
      return token;
    } catch {
      return rejectWithValue("Failed to fetch CSRF token");
    }
  }
);

// Login User
export const loginUser = createAsyncThunk<LoginResponse, { identifier: string; password: string }>(
  "auth/loginUser",
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      // ✅ Add Sanctum CSRF token if using Sanctum
      const response = await loginApi(credentials);
      await dispatch(fetchCsrfToken());
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

// Refresh Access Token
export const refreshAccessToken = createAsyncThunk<RefreshResponse>(
  "auth/refreshAccessToken",
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (state.auth.isLoggedOut) throw new Error("User logged out, skip refresh");

      const expiry = localStorage.getItem("refreshTokenExpiry");
      if (!expiry) {
        dispatch(logout());
        return rejectWithValue("No refresh token expiry found");
      }

      const expiryDate = new Date(expiry);
      if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        dispatch(logout());
        return rejectWithValue("Refresh token expired");
      }

      if (!state.auth.csrfToken) {
        await dispatch(fetchCsrfToken());
      }

      const response = await refreshApi();
      return response;
    } catch (err: any) {
      dispatch(logout());
      return rejectWithValue(err.response?.data?.message || "Refresh failed");
    }
  }
);

// Logout Current Session
export const logoutUser = createAsyncThunk<void>(
  "auth/logoutUser",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await logoutApi();
      dispatch(logout());
      await dispatch(fetchCsrfToken());
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

// Logout All Sessions
export const logoutUserAll = createAsyncThunk<void>(
  "auth/logoutUserAll",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await logoutAllApi();
      dispatch(logout());
      await dispatch(fetchCsrfToken());
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout all failed");
    }
  }
);

// Logout Other Sessions
export const logoutUserOther = createAsyncThunk<void>(
  "auth/logoutUserOther",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await logoutOthersApi();
      await dispatch(fetchCsrfToken());
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout others failed");
    }
  }
);

// =========================
// Slice
// =========================
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.csrfToken = null;
      state.loading = false;
      state.error = null;
      state.isLoggedOut = true;
      delete api.defaults.headers.common["X-CSRF-TOKEN"];
      localStorage.removeItem("refreshTokenExpiry");
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.isLoggedOut = false;
    },
    setCsrfToken(state, action: PayloadAction<string>) {
      state.csrfToken = action.payload;
      api.defaults.headers.common["X-CSRF-TOKEN"] = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CSRF Token fetch
      .addCase(fetchCsrfToken.fulfilled, (state, action) => {
        state.csrfToken = action.payload;
      })
      .addCase(fetchCsrfToken.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isLoggedOut = false;
        state.error = null;
        localStorage.setItem("refreshTokenExpiry", action.payload.refreshTokenExpiry);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Refresh
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        if (action.payload.user) state.user = action.payload.user;
        state.isLoggedOut = false;
        state.error = null;
        localStorage.setItem("refreshTokenExpiry", action.payload.refreshTokenExpiry);
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.accessToken = null;
        state.user = null;
        state.isLoggedOut = true;
        state.error = action.payload as string;
        localStorage.removeItem("refreshTokenExpiry");
      })

      // Logout errors
      .addCase(logoutUser.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(logoutUserAll.rejected, (state, action) => { state.error = action.payload as string; })
      .addCase(logoutUserOther.rejected, (state, action) => { state.error = action.payload as string; });
  },
});

export const { logout, setAccessToken, setCsrfToken, clearError } = authSlice.actions;
export default authSlice.reducer;
