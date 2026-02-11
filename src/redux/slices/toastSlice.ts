// src/store/toastSlice.ts
import { createSlice, nanoid } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export type ToastType =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "custom"

export type ToastPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center"

export type ToastAnimation =
  | "slide-right-in"
  | "slide-left-in"
  | "slide-up-in"
  | "slide-down-in"
  | "fade-in"

export interface Toast {
  id: string
  type: ToastType
  message: string
  showClose: boolean
  position: ToastPosition
  animation: ToastAnimation
  duration: number
}

type ToastInput = Partial<Omit<Toast, "id">>

interface ToastState {
  toasts: Toast[]
}

const initialState: ToastState = {
  toasts: [],
}

/**
 * 🔥 Centralized Default Toast
 */
const DEFAULT_TOAST: Omit<Toast, "id"> = {
  type: "info",
  message: "",
  showClose: true,
  position: "top-right",
  animation: "slide-right-in",
  duration: 3000,
}

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.toasts.push(action.payload)
      },

      /**
       * ✅ No options required
       * showToast() works
       * showToast({ message: "Hi" }) works
       */
      prepare: (options?: ToastInput) => ({
        payload: {
          id: nanoid(),
          ...DEFAULT_TOAST,
          ...options,
        },
      }),
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(
        (t) => t.id !== action.payload
      )
    },
  },
})

export const { showToast, removeToast } = toastSlice.actions
export default toastSlice.reducer
