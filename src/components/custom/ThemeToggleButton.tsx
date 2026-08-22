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
      className="cursor-pointer p-1.5 rounded-md transition-colors bg-primary/10 text-primary hover:bg-primary/20"
      aria-label="Toggle Dark Mode"
    >
      {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}