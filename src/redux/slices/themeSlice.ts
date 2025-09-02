import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type Theme = "light" | "dark"

interface ThemeState {
  current: Theme
}

// 🔹 Determine initial theme
const savedTheme = (localStorage.getItem("theme") as Theme) || "light"

// 🔹 Apply it immediately to <html> so Tailwind dark: classes work on page load
document.documentElement.classList.remove("light", "dark")
document.documentElement.classList.add(savedTheme)

const initialState: ThemeState = {
  current: savedTheme,
}

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.current = action.payload
      localStorage.setItem("theme", action.payload)

      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(action.payload)
    },
    toggleTheme: (state) => {
      const newTheme: Theme = state.current === "light" ? "dark" : "light"
      state.current = newTheme
      localStorage.setItem("theme", newTheme)

      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(newTheme)
    },
  },
})

export const { setTheme, toggleTheme } = themeSlice.actions
export default themeSlice.reducer
