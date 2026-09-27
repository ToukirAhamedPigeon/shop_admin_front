// src/components/module/admin/layout/Header.tsx
import { Link } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { toggleSidebar } from '@/redux/slices/sidebarSlice'
import { cn } from '@/lib/utils'
import LanguageSwitcher from '@/components/custom/LanguageSwitcher'
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton'
import UserDropdown from './UserDropdown'
import SidebarMobileSheet from './SidebarMobileSheet'
import CommandPalette from './CommandPalette'
import { RAIL_WIDTH, SIDEBAR_WIDTH } from './Sidebar'

/** Logo and name. The name hides when the sidebar is collapsed to a rail. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      aria-label="AIMS home"
    >
      <span className="brand-mark flex size-9 shrink-0 items-center justify-center rounded-xl">
        <img src="/logo.png" alt="" width={24} height={24} />
      </span>
      <span className={cn('min-w-0 transition-opacity duration-200', compact && 'pointer-events-none opacity-0')}>
        <span className="block text-[15px] font-semibold leading-tight tracking-tight text-foreground">AIMS</span>
        <span className="block truncate text-[11px] leading-tight text-muted-foreground">AI Powered Management System</span>
      </span>
    </Link>
  )
}

export default function Header() {
  const dispatch = useAppDispatch()
  const collapsed = !useAppSelector((s) => s.sidebar.isVisible)
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 border-b border-border bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      {/* Desktop: the brand sits on the sidebar's navy, so the column reads as one piece. */}
      <div
        className={cn(
          'dark app-sidebar app-sidebar--top hidden shrink-0 items-center overflow-hidden px-[18px] lg:flex',
          'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH
        )}
      >
        <Brand compact={collapsed} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-4">
        {/* Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <SidebarMobileSheet />
          <Link to="/" className="flex items-center gap-2" aria-label="AIMS home">
            <img src="/logo.png" alt="" width={28} height={28} />
            <span className="text-sm font-semibold text-foreground">AIMS</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="header-icon-btn hidden lg:inline-flex"
        >
          <ToggleIcon className="size-[18px]" />
        </button>

        <div className="flex flex-1 justify-end md:justify-start md:pl-2">
          <CommandPalette />
        </div>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggleButton />
          <span aria-hidden className="mx-1.5 hidden h-6 w-px bg-border sm:block" />
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}
