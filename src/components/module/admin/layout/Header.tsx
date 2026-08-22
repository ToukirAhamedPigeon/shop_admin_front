// src/components/module/admin/layout/Header.tsx
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import SidebarMobileSheet from './SidebarMobileSheet';
import { useAppDispatch } from '@/hooks/useRedux';
import { toggleSidebar } from '@/redux/slices/sidebarSlice';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/custom/LanguageSwitcher';
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton';

export default function Header() {
  function ToggleSidebarButton() {
    const dispatch = useAppDispatch();
    const toggleCollapse = () => {
      dispatch(toggleSidebar());
    };
    return (
      <Button
        variant="ghost"
        onClick={toggleCollapse}
        className="!p-2 !h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background shadow-sm"
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section - Fixed width, no position change */}
        <div className="hidden lg:flex items-center gap-4" style={{ width: '16rem' }}>
          <div className="flex items-center gap-3">
            <Logo isTitle={false} />
            <div className="flex flex-col">
              <span className="text-md font-bold text-foreground">
                AIMS
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                AI Powered Management System
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <ToggleSidebarButton />
          </div>
        </div>

        {/* Mobile section */}
        <div className="lg:hidden flex items-center gap-3">
          <SidebarMobileSheet />
          <Logo isTitle={false} />
          <span className="text-sm font-bold text-foreground">
            AIMS
          </span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggleButton />
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}