// src/store/sidebarSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface SidebarState {
  /** Full sidebar when true; the collapsed icon rail when false. */
  isVisible: boolean;
}

const STORAGE_KEY = 'sidebar-collapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const persist = (isVisible: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, isVisible ? '0' : '1');
  } catch {
    // Storage can be unavailable (private mode); the state still works for this visit.
  }
};

const initialState: SidebarState = {
  isVisible: !readCollapsed(),
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    showSidebar: (state) => {
      state.isVisible = true;
      persist(true);
    },
    hideSidebar: (state) => {
      state.isVisible = false;
      persist(false);
    },
    toggleSidebar: (state) => {
      state.isVisible = !state.isVisible;
      persist(state.isVisible);
    },
    setSidebar: (state, action) => {
      state.isVisible = action.payload;
      persist(state.isVisible);
    },
  },
});

export const { showSidebar, hideSidebar, toggleSidebar, setSidebar } = sidebarSlice.actions;
export default sidebarSlice.reducer;
