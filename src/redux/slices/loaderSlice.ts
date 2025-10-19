// store/slices/loaderSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface LoaderState {
  visible: boolean;
  message: string;
  spinnerColor: string;
  messageColor: string;
}

interface ShowLoaderPayload {
  message?: string;
  spinnerColor?: string;
  messageColor?: string;
}

const initialState: LoaderState = {
  visible: false,
  message: "",
  spinnerColor: "#000000",
  messageColor: "#000000",
};

const loaderSlice = createSlice({
  name: "loader",
  initialState,
  reducers: {
    showLoader: (state, action: PayloadAction<ShowLoaderPayload | undefined>) => {
      // console.log("Show loader");
      const { message, spinnerColor, messageColor } = action.payload || {};
      state.visible = true;
      state.message = message || "";
      state.spinnerColor = spinnerColor || "#000000";
      state.messageColor = messageColor || "#000000";
    },
    hideLoader: (state) => {
      // console.log("Hide loader");
      state.visible = false;
      state.message = "";
      state.spinnerColor = "#000000";
      state.messageColor = "#000000";
    },
  },
});

export const { showLoader, hideLoader } = loaderSlice.actions;
export default loaderSlice.reducer;
