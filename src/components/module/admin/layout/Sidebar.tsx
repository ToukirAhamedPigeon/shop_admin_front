// src/components/module/admin/layout/Sidebar.tsx
import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAppSelector } from '@/hooks/useRedux'
import { useTranslations } from '@/hooks/useTranslations'
import { cn } from '@/lib/utils'
import { Can } from '@/components/custom/Can'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Nav from './Nav'

export const SIDEBAR_WIDTH = 'w-64'
export const RAIL_WIDTH = 'w-[72px]'

const initialsOf = (name?: string) =>
  (name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** Signed-in user at the bottom of the sidebar: opens the profile, with a logout button. */
function SidebarUser({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { t } = useTranslations()
  const user = useAppSelector((s) => s.auth.user)
  if (!user) return null
  const role = user.roles?.[0]

  const avatar = (
    <Avatar className="size-9 ring-2 ring-white/10">
      <AvatarImage
        src={user.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined}
        alt=""
        className="object-cover"
      />
      <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
        {initialsOf(user.name)}
      </AvatarFallback>
    </Avatar>
  )

  if (collapsed) {
    return (
      <Link
        to="/settings/profile"
        className="group relative mx-auto flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        aria-label={t('common.profile.title', 'My Profile')}
      >
        {avatar}
        <span className="nav-tip">{user.name}</span>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-1 rounded-xl p-1.5 transition-colors hover:bg-sidebar-accent">
      <Link
        to="/settings/profile"
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        {avatar}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</span>
          <span className="block truncate text-xs capitalize text-sidebar-foreground/60">{role ?? user.email}</span>
        </span>
      </Link>
      <Can anyOf={['logout-admin-auth']}>
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            window.dispatchEvent(new CustomEvent('logout'))
          }}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sidebar-foreground/60 outline-none transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={t('common.logout', 'Logout')}
          title={t('common.logout', 'Logout')}
        >
          <LogOut className="size-4" />
        </button>
      </Can>
    </div>
  )
}

/** Navigation and user card, shared by the desktop sidebar and the mobile sheet. */
export function SidebarBody({
  collapsed = false,
  onNavigate,
  layoutGroup,
}: {
  collapsed?: boolean
  onNavigate?: () => void
  layoutGroup?: string
}) {
  return (
    <>
      <div className={cn('min-h-0 flex-1', collapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden')}>
        <Nav collapsed={collapsed} onLinkClick={onNavigate} layoutGroup={layoutGroup} />
      </div>
      <div className="relative shrink-0 border-t border-sidebar-border p-3">
        <SidebarUser collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </>
  )
}

export default function Sidebar() {
  const { isVisible } = useAppSelector((state) => state.sidebar)
  const collapsed = !isVisible

  return (
    // Always the brand navy (dark tokens), like the login stage and dashboard hero.
    <aside
      className={cn(
        'dark app-sidebar fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] flex-col text-sidebar-foreground lg:flex',
        'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH
      )}
    >
      <SidebarBody collapsed={collapsed} layoutGroup="sidebar" />
    </aside>
  )
}
