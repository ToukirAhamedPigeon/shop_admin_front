// src/store/toastSlice.ts
import { createSlice, nanoid } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "success" | "danger" | "warning" | "info" | "custom"
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

interface ToastState {
  toasts: Toast[]
}

const initialState: ToastState = {
  toasts: [],
}

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.toasts.push(action.payload)
      },
      prepare: (options: Partial<Omit<Toast, "id">>) => ({
        payload: {
          id: nanoid(),
          type: options.type || "info",
          message: options.message || "",
          showClose: options.showClose ?? true,
          position: options.position || "top-right",
          animation: options.animation || "slide-right-in",
          duration: options.duration || 3000,
        } as Toast,
      }),
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
  },
})

export const { showToast, removeToast } = toastSlice.actions
export default toastSlice.reducer
