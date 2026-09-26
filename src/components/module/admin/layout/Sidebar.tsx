// src/components/module/admin/layout/Sidebar.tsx
'use client'
import { useAppSelector } from '@/hooks/useRedux';
import { cn } from '@/lib/utils'
import Nav from './Nav'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'
import { Can } from '@/components/custom/Can'

export default function Sidebar() {
  const { isVisible } = useAppSelector((state) => state.sidebar)

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed top-16 left-0 z-10 transition-all duration-300 overflow-hidden",
        "bg-sidebar border-r border-sidebar-border",
        !isVisible ? "w-0" : "w-64",
        "h-[calc(100vh-4rem)]"
      )}
    >
      {/* Scrollable nav content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <Nav />
      </div>

      {/* Sidebar Footer */}
      <div className="flex-shrink-0 p-3 mt-auto border-t border-sidebar-border">
        <div className="flex items-center justify-center gap-6">
          <Can anyOf={['read-admin-profile']}>
            <Link
              to="/settings/profile"
              className="group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors duration-200"
              title="Profile"
            >
              <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Profile</span>
            </Link>
          </Can>

          <Can anyOf={['read-admin-settings']}>
            <Link
              to="/settings/app-settings"
              className="group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors duration-200"
              title="Settings"
            >
              <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Settings className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Settings</span>
            </Link>
          </Can>

          <Can anyOf={['logout-admin-auth']}>
            <button
              className="group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors duration-200 cursor-pointer"
              title="Logout"
              onClick={() => {
                const logoutEvent = new CustomEvent('logout');
                window.dispatchEvent(logoutEvent);
              }}
            >
              <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-destructive/10 group-hover:text-destructive transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-medium text-muted-foreground group-hover:text-destructive transition-colors">Logout</span>
            </button>
          </Can>
        </div>
      </div>
    </aside>
  )
}
