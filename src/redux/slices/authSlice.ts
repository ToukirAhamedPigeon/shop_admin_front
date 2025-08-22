import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// =========================
// Auth State Interface
// =========================
interface AuthState {
  user: any | null;            // Stores logged-in user info
  accessToken: string | null;  // JWT access token (short-lived, Redux only)
  csrfToken: string | null;    // CSRF token (for form protection)
  loading: boolean;            // Loading state for async actions
  error: string | null;        // Error messages
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  csrfToken: null,
  loading: false,
  error: null,
};

// =========================
// Async Thunks
// =========================

// ✅ Fetch CSRF Token (on app load or before login)
export const fetchCsrfToken = createAsyncThunk(
  "auth/fetchCsrfToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/csrf/token");
      return response.data.csrfToken; // { csrfToken }
    } catch (err: any) {
      return rejectWithValue("Failed to fetch CSRF token");
    }
  }
);

// ✅ Login User
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    credentials: { identifier: string; password: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const csrfToken = state.auth.csrfToken;

      const response = await api.post("/auth/login", credentials, {
        headers: { "X-CSRF-TOKEN": csrfToken || "" }, // Attach CSRF token
      });

      // Backend returns: { accessToken, user }
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

// ✅ Refresh Access Token (using HttpOnly Refresh cookie)
export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/refresh", {}, { withCredentials: true });
      return response.data; // { accessToken, user? }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Refresh failed");
    }
  }
);

// ✅ Logout Current Session
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.post("/auth/logout");
      dispatch(logout()); // clear Redux state
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

// ✅ Logout From All Devices
export const logoutUserAll = createAsyncThunk(
  "auth/logoutUserAll",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.post("/auth/logout-all");
      dispatch(logout()); // clear Redux state
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

// ✅ Logout From Other Devices (keep current session active)
export const logoutUserOther = createAsyncThunk(
  "auth/logoutUserOther",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout-others");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
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
    // Manual logout (used by thunks too)
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.csrfToken = null;
      state.error = null;
    },

    // Set access token (after refresh)
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },

    // Set CSRF token (can be manually updated if needed)
    setCsrfToken(state, action: PayloadAction<string>) {
      state.csrfToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // -------------------------
      // Fetch CSRF Token
      // -------------------------
      .addCase(fetchCsrfToken.fulfilled, (state, action) => {
        state.csrfToken = action.payload;
      })
      .addCase(fetchCsrfToken.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // -------------------------
      // Login
      // -------------------------
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------------------------
      // Refresh Token
      // -------------------------
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.accessToken = null;
        state.user = null;
        state.error = action.payload as string;
      })

      // -------------------------
      // Logout Errors
      // -------------------------
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(logoutUserAll.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(logoutUserOther.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// =========================
// Exports
// =========================
export const { logout, setAccessToken, setCsrfToken } = authSlice.actions;
export default authSlice.reducer;
