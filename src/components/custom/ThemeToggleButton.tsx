// src/components/custom/ThemeToggleButton.tsx
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/redux/store"
import { toggleTheme } from "@/redux/slices/themeSlice"
import { Sun, Moon } from "lucide-react"

export function ThemeToggleButton() {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useSelector((state: RootState) => state.theme.current)
  const isDarkMode = theme === 'dark'

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="header-icon-btn"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Light mode" : "Dark mode"}
    >
      {/* Keyed so the icon swaps with a small turn. */}
      <span key={theme} className="theme-icon-swap inline-flex">
        {isDarkMode ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </span>
    </button>
  )
}