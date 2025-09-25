// redux/slices/loaderSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface LoaderState {
  isVisible: boolean;
  showLogo: boolean;
  showAppName: boolean;
  slogan: string;
}

const initialState: LoaderState = {
  isVisible: false,
  showLogo: false,
  showAppName: false,
  slogan: "Loading...",
};

const loaderSlice = createSlice({
  name: "loader",
  initialState,
  reducers: {
    showLoader: (
      state,
      action: PayloadAction<{
        showLogo?: boolean;
        showAppName?: boolean;
        slogan?: string;
      }>
    ) => {
      state.isVisible = true;
      state.showLogo = action.payload.showLogo ?? false;
      state.showAppName = action.payload.showAppName ?? false;
      state.slogan = action.payload.slogan ?? "Loading...";
    },
    hideLoader: (state) => {
      state.isVisible = false;
      state.showLogo = false;
      state.showAppName = false;
      state.slogan = "Loading...";
    },
  },
});

export const { showLoader, hideLoader } = loaderSlice.actions;
export default loaderSlice.reducer;
