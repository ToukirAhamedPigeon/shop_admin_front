import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type Theme = "light" | "dark"

interface ThemeState {
  current: Theme
}

// Class for Tailwind's dark: variants; color-scheme for scrollbars and form
// controls (index.html sets both before the first paint).
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

// 🔹 Determine initial theme
const savedTheme = (localStorage.getItem("theme") as Theme) || "light"

// 🔹 Apply it immediately to <html> so Tailwind dark: classes work on page load
applyTheme(savedTheme)

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

      applyTheme(action.payload)
    },
    toggleTheme: (state) => {
      const newTheme: Theme = state.current === "light" ? "dark" : "light"
      state.current = newTheme
      localStorage.setItem("theme", newTheme)

      applyTheme(newTheme)
    },
  },
})

export const { setTheme, toggleTheme } = themeSlice.actions
export default themeSlice.reducer
