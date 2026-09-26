// src/components/module/admin/layout/Header.tsx
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import SidebarMobileSheet from './SidebarMobileSheet';
import { useAppDispatch } from '@/hooks/useRedux';
import { toggleSidebar } from '@/redux/slices/sidebarSlice';
import { PanelLeft } from 'lucide-react';
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
        size="icon"
        aria-label="Toggle sidebar"
        className="text-muted-foreground hover:text-foreground"
      >
        <PanelLeft className="h-[18px] w-[18px]" />
      </Button>
    );
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/75"
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section - Fixed width, no position change */}
        <div className="hidden lg:flex items-center gap-2" style={{ width: '15rem' }}>
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo isTitle={false} />
            <div className="flex min-w-0 flex-col">
              <span className="text-[15px] font-semibold leading-tight tracking-tight text-foreground">
                AIMS
              </span>
              <span className="truncate text-[11px] text-muted-foreground leading-tight">
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
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggleButton />
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}