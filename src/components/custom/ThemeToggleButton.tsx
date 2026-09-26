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
      className="cursor-pointer inline-flex size-9 items-center justify-center rounded-md transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
      aria-label="Toggle Dark Mode"
    >
      {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}