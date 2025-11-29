import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface LoaderState {
  visible: boolean;
  message: string;
  spinnerColor: string;
  darkSpinnerColor: string;
  messageColor: string;
  darkMessageColor: string;
}

export interface ShowLoaderPayload {
  message?: string;
  spinnerColor?: string;
  darkSpinnerColor?: string;
  messageColor?: string;
  darkMessageColor?: string;
}

const initialState: LoaderState = {
  visible: false,
  message: "",
  spinnerColor: "#000000",
  darkSpinnerColor: "#ffffff",
  messageColor: "#000000",
  darkMessageColor: "#ffffff",
};

const loaderSlice = createSlice({
  name: "loader",
  initialState,
  reducers: {
    showLoader: (state, action: PayloadAction<ShowLoaderPayload | undefined>) => {
      const {
        message,
        spinnerColor,
        darkSpinnerColor,
        messageColor,
        darkMessageColor,
      } = action.payload || {};

      state.visible = true;
      state.message = message || "";
      state.spinnerColor = spinnerColor || "#1fb4ff";
      state.darkSpinnerColor = darkSpinnerColor || "#ffffff";
      state.messageColor = messageColor || "#1fb4ff";
      state.darkMessageColor = darkMessageColor || "#ffffff";
    },
    hideLoader: (state) => {
      state.visible = false;
      state.message = "";
      state.spinnerColor = "#1fb4ff";
      state.darkSpinnerColor = "#ffffff";
      state.messageColor = "#1fb4ff";
      state.darkMessageColor = "#ffffff";
    },
  },
});

export const { showLoader, hideLoader } = loaderSlice.actions;
export default loaderSlice.reducer;
