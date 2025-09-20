// src/store/sidebarSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface SidebarState {
  isVisible: boolean;
}

const initialState: SidebarState = {
  isVisible: true,
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    showSidebar: (state) => {
      state.isVisible = true;
    },
    hideSidebar: (state) => {
      state.isVisible = false;
    },
    toggleSidebar: (state) => {
      state.isVisible = !state.isVisible;
    },
    setSidebar: (state, action) => {
      state.isVisible = action.payload;
    },
  },
});

export const { showSidebar, hideSidebar, toggleSidebar, setSidebar } = sidebarSlice.actions;
export default sidebarSlice.reducer;
