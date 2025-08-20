import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/axios";

interface AuthState {
  user: any | null;          // Stores logged-in user info
  accessToken: string | null; // JWT access token (kept only in Redux)
  loading: boolean;          // Loading state for async actions
  error: string | null;      // Error messages
}

const initialState: AuthState = {
  user: null,
  accessToken: null, // initially null, no localStorage
  loading: false,
  error: null,
};

// -------------------------
// Async Thunks
// -------------------------

// Login user
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: { identifier: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      // Backend returns: { accessToken, user }
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

// Refresh access token
export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { rejectWithValue }) => {
    try {
      // Call refresh endpoint using HttpOnly cookie (withCredentials)
      const response = await api.post("/auth/refresh", {}, { withCredentials: true });
      return response.data; // { accessToken }
    } catch (err: any) {
      // Only reject if refresh token is invalid/expired
      return rejectWithValue(err.response?.data?.message || "Refresh failed");
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.post("/auth/logout"); // backend clears refresh token
      dispatch(logout()); // clear Redux state
    } catch (err: any) {
      console.log("Logout error:", err);
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

export const logoutUserAll = createAsyncThunk(
  "auth/logoutUserAll",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.post("/auth/logout-all"); // backend clears refresh token
      dispatch(logout()); // clear Redux state
    } catch (err: any) {
      console.log("Logout error:", err);
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

export const logoutUserOther = createAsyncThunk(
  "auth/logoutUserOther",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout-others"); // backend clears refresh token
    } catch (err: any) {
      console.log("Logout error:", err);
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

// -------------------------
// Slice
// -------------------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Manual logout
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.error = null;
    },
    // Set access token (used after refresh)
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
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

      // Refresh token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        //console.log("Access token refreshed:", action.payload.accessToken);
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        // Only logout if refresh token is actually invalid/expired
        // For network errors, you might not want to set error here
        state.accessToken = null;
        state.user = null;
        state.error = action.payload as string;
      })

      // Logout
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

export const { logout, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
