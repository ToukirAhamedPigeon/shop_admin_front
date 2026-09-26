// src/components/module/admin/layout/SidebarMobileSheet.tsx
'use client'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import Nav from './Nav'
import LanguageSwitcher from '@/components/custom/LanguageSwitcher'
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'
import { Can } from '@/components/custom/Can'

export default function SidebarMobileSheet() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 [&>button.sheet-close span]:hidden border-r border-sidebar-border overflow-hidden w-[280px] bg-sidebar"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="flex items-start justify-center py-4 px-5 border-b border-sidebar-border">
            <SheetTitle className="w-full">
              <div className="flex items-center gap-2">
                <Logo isTitle={false} />
                <div className="flex flex-col items-start">
                  <span className="text-md font-bold text-foreground">
                    AIMS
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
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

          {/* Mobile Sidebar Footer */}
          <div className="flex-shrink-0 p-4 mt-auto border-t border-sidebar-border">
            <div className="flex items-center justify-center gap-8">
              <Can anyOf={['read-admin-profile']}>
                <Link
                  to="/settings/profile"
                  className="group flex flex-col items-center gap-1 transition-colors duration-200"
                  title="Profile"
                  onClick={() => setOpen(false)}
                >
                  <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Profile</span>
                </Link>
              </Can>

              <Can anyOf={['read-admin-settings']}>
                <Link
                  to="/settings/app-settings"
                  className="group flex flex-col items-center gap-1 transition-colors duration-200"
                  title="Settings"
                  onClick={() => setOpen(false)}
                >
                  <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Settings</span>
                </Link>
              </Can>

              <Can anyOf={['logout-admin-auth']}>
                <button
                  className="group flex flex-col items-center gap-1 transition-colors duration-200 cursor-pointer"
                  title="Logout"
                  onClick={() => {
                    const logoutEvent = new CustomEvent('logout');
                    window.dispatchEvent(logoutEvent);
                    setOpen(false);
                  }}
                >
                  <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:bg-destructive/10 group-hover:text-destructive transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-destructive transition-colors">Logout</span>
                </button>
              </Can>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
