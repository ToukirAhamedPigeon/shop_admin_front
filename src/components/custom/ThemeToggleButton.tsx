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
      className={`cursor-pointer p-1.5 rounded-md transition-all duration-200 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 hover:text-amber-300' 
          : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 hover:from-indigo-500/30 hover:to-purple-500/30 hover:text-indigo-700'
      }`}
      aria-label="Toggle Dark Mode"
    >
      {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}