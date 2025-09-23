'use client'
import { useAppSelector } from '@/hooks/useRedux';
import { cn } from '@/lib/utils'
import Nav from './Nav'

export default function Sidebar() {
  const { isVisible } = useAppSelector((state) => state.sidebar)
  const { current: theme } = useAppSelector((state) => state.theme)

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed top-16 left-0 z-10 border-r border-gray-900 transition-all duration-300 right-deep-shadow",
        !isVisible ? "w-0" : "w-64",
        theme === "dark" ? "secondary-gradient-dark" : "secondary-gradient",
        "h-[calc(100vh-4rem)] overflow-y-auto"
      )}
    >
      <Nav/>
    </aside>
  )
}
