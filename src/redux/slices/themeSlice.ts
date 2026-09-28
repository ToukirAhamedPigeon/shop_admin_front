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

// 🔹 Determine initial theme: the header choice, else the default saved in
// App Settings (cached as "theme-default"), else light.
const readStored = (key: string): Theme | null => {
  try {
    const v = localStorage.getItem(key)
    return v === "light" || v === "dark" ? v : null
  } catch {
    return null
  }
}
const savedTheme: Theme = readStored("theme") ?? readStored("theme-default") ?? "light"

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
    /** The App Settings default: applied but not stored as the person's own choice. */
    applyDefaultTheme: (state, action: PayloadAction<Theme>) => {
      if (state.current === action.payload) return
      state.current = action.payload
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

export const { setTheme, applyDefaultTheme, toggleTheme } = themeSlice.actions
export default themeSlice.reducer
