import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/redux/store"
import { toggleTheme } from "@/redux/slices/themeSlice"
import { Sun, Moon } from "lucide-react"

export function ThemeToggleButton() {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useSelector((state: RootState) => state.theme.current)

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="cursor-pointer p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition"
      aria-label="Toggle Dark Mode"
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}
