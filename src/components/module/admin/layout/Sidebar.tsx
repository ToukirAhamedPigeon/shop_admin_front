// src/components/module/admin/layout/Sidebar.tsx (Simpler Footer)
'use client'
import { useAppSelector } from '@/hooks/useRedux';
import { cn } from '@/lib/utils'
import Nav from './Nav'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'
import { Can } from '@/components/custom/Can'

export default function Sidebar() {
  const { isVisible } = useAppSelector((state) => state.sidebar)
  const { current: theme } = useAppSelector((state) => state.theme)

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed top-16 left-0 z-10 transition-all duration-300 overflow-hidden",
        !isVisible ? "w-0" : "w-64",
        "h-[calc(100vh-4rem)]"
      )}
    >
      {/* Background image layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: theme === 'dark'
            ? "url('/sidebar-bg-dark.jpg')"
            : "url('/sidebar-bg.jpg')",
        }}
      />

      {/* Premium overlay for dark mode - rich and deep */}
      {theme === 'dark' ? (
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(160deg,
                rgba(8, 10, 30, 0.92) 0%,
                rgba(15, 20, 50, 0.88) 40%,
                rgba(10, 15, 40, 0.93) 100%
              )
            `,
          }}
        />
      ) : (
        /* Light mode: Soft blue to warm orange gradient */
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, 
              rgba(213, 233, 253, 1) 0%, 
              rgba(217, 235, 255, 0.95) 30%, 
              rgba(255, 245, 237, 0.9) 70%, 
              rgba(255, 188, 141, 0.8) 100%)`,
          }}
        />
      )}

      {/* Subtle shimmer line at right border */}
      <div
        className="absolute right-0 top-0 bottom-0 w-px"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, transparent, rgba(100,150,255,0.3) 30%, rgba(100,150,255,0.15) 70%, transparent)'
            : 'linear-gradient(to bottom, transparent, rgba(168, 227, 253, 0.3) 20%, rgba(255, 188, 141, 0.25) 70%, transparent)',
        }}
      />

      {/* Scrollable nav content */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
        <Nav />
      </div>

      {/* Simple Sidebar Footer with Whiter Glass Effect */}
      <div className="relative z-10 flex-shrink-0 p-3 mt-auto">
        {/* Glass background overlay */}
        <div 
          className="absolute inset-0 backdrop-blur-md"
          style={{
            background: theme === 'dark'
              ? 'rgba(17, 24, 39, 0.01)'
              : 'rgba(255, 255, 255, 0.3)',
            borderTop: theme === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: theme === 'dark'
              ? '0 -4px 10px rgba(0,0,0,0.1)'
              : '0 -4px 10px rgba(0,0,0,0.02)',
          }}
        />
        
        <div className="relative z-10 flex items-center justify-center gap-6">
          <Can anyOf={['read-admin-profile']}>
            <Link
              to="/settings/profile"
              className="group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
              title="Profile"
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md group-hover:shadow-lg transition-all">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors">Profile</span>
            </Link>
          </Can>

          <Can anyOf={['read-admin-settings']}>
            <Link
              to="/settings/app-settings"
              className="group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
              title="Settings"
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md group-hover:shadow-lg transition-all">
                <Settings className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-purple-600 transition-colors">Settings</span>
            </Link>
          </Can>

          <Can anyOf={['logout-admin-auth']}>
            <button
              className="group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer"
              title="Logout"
              onClick={() => {
                const logoutEvent = new CustomEvent('logout');
                window.dispatchEvent(logoutEvent);
              }}
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-md group-hover:shadow-lg transition-all">
                <LogOut className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-red-600 transition-colors">Logout</span>
            </button>
          </Can>
        </div>
      </div>
    </aside>
  )
}