// src/components/module/admin/layout/SidebarMobileSheet.tsx (Simpler Footer)
'use client'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import Nav from './Nav'
import LanguageSwitcher from '@/components/custom/LanguageSwitcher'
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton'
import { useAppSelector } from '@/hooks/useRedux'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'
import { Can } from '@/components/custom/Can'

export default function SidebarMobileSheet() {
  const [open, setOpen] = useState(false)
  const { current: theme } = useAppSelector((state) => state.theme)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 [&>button.sheet-close span]:hidden border-none overflow-hidden w-[280px]"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: theme === 'dark'
              ? "url('/sidebar-bg-dark.jpg')"
              : "url('/sidebar-bg.jpg')",
          }}
        />
        
        {/* Premium overlay - matching desktop sidebar with blue to orange gradient */}
        {theme === 'dark' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, 
                rgba(168, 227, 253, 1) 0%, 
                rgba(189, 235, 255, 1) 20%, 
                rgba(255, 195, 154, 0.85) 60%, 
                rgba(255, 188, 141, 0.8) 100%)`,
            }}
          />
        )}

        {/* Subtle shimmer line at right border for mobile */}
        <div
          className="absolute right-0 top-0 bottom-0 w-px"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(to bottom, transparent, rgba(100,150,255,0.3) 30%, rgba(100,150,255,0.15) 70%, transparent)'
              : 'linear-gradient(to bottom, transparent, rgba(168, 227, 253, 0.5) 20%, rgba(255, 188, 141, 0.4) 70%, transparent)',
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          <SheetHeader
            className="flex items-start justify-center py-4 px-5"
            style={{
              borderBottom: theme === 'dark' 
                ? '1px solid rgba(255,255,255,0.08)' 
                : '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <SheetTitle className="w-full">
              <div className="flex items-center gap-2">
                <Logo isTitle={false} />
                <div className="flex flex-col items-start">
                  <span className="text-md font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    AIMS
                  </span>
                  <span className="text-[10px] text-gray-700 dark:text-gray-400 leading-tight">
                    AI Powered Management System
                  </span>
                </div>
              </div>
            </SheetTitle>
            <SheetClose asChild>
              <button className="absolute top-5 right-5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </SheetClose>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              <div className="flex flex-row justify-start items-center gap-2 mb-4">
                <LanguageSwitcher />
                <ThemeToggleButton />
              </div>
              <Nav onLinkClick={() => setOpen(false)} />
            </div>
          </div>

          {/* Mobile Sidebar Footer with Whiter Glass Effect */}
          <div className="relative z-10 flex-shrink-0 p-4 mt-auto">
            {/* Glass background overlay */}
            <div 
              className="absolute inset-0 backdrop-blur-md"
              style={{
                background: theme === 'dark'
                  ? 'rgba(17, 24, 39, 0.01)'
                  : 'rgba(255, 255, 255, 0.3)',
                borderTop: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: theme === 'dark'
                  ? '0 -4px 10px rgba(0,0,0,0.01)'
                  : '0 -4px 10px rgba(0,0,0,0.02)',
              }}
            />
            
            <div className="relative z-10 flex items-center justify-center gap-8">
              <Can anyOf={['read-admin-profile']}>
                <Link
                  to="/settings/profile"
                  className="group flex flex-col items-center gap-1 transition-all duration-200 hover:scale-110"
                  title="Profile"
                  onClick={() => setOpen(false)}
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md group-hover:shadow-lg transition-all">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors">Profile</span>
                </Link>
              </Can>

              <Can anyOf={['read-admin-settings']}>
                <Link
                  to="/settings/app"
                  className="group flex flex-col items-center gap-1 transition-all duration-200 hover:scale-110"
                  title="Settings"
                  onClick={() => setOpen(false)}
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md group-hover:shadow-lg transition-all">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-purple-600 transition-colors">Settings</span>
                </Link>
              </Can>

              <Can anyOf={['logout-admin-auth']}>
                <button
                  className="group flex flex-col items-center gap-1 transition-all duration-200 hover:scale-110 cursor-pointer"
                  title="Logout"
                  onClick={() => {
                    const logoutEvent = new CustomEvent('logout');
                    window.dispatchEvent(logoutEvent);
                    setOpen(false);
                  }}
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-md group-hover:shadow-lg transition-all">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-red-600 transition-colors">Logout</span>
                </button>
              </Can>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}