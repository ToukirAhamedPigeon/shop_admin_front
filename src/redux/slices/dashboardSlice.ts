import { createSlice } from "@reduxjs/toolkit";

interface DashboardState {
  stats: any;
}

const initialState: DashboardState = {
  stats: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setStats(state, action) {
      state.stats = action.payload;
    },
    clearStats(state) {
      state.stats = null;
    },
  },
});

export const { setStats, clearStats } = dashboardSlice.actions;
export default dashboardSlice.reducer;
