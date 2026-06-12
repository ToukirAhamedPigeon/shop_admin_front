// src/components/module/admin/layout/Header.tsx
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import SidebarMobileSheet from './SidebarMobileSheet';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { toggleSidebar } from '@/redux/slices/sidebarSlice';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/custom/LanguageSwitcher';
import { ThemeToggleButton } from '@/components/custom/ThemeToggleButton';
import { motion } from 'framer-motion';

export default function Header() {
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  const { isVisible } = useAppSelector((state) => state.sidebar);

  function ToggleSidebarButton() {
    const dispatch = useAppDispatch();
    const toggleCollapse = () => {
      dispatch(toggleSidebar());
    };
    return (
      <Button
        variant="link"
        onClick={toggleCollapse}
        className={`rounded-full transition-all duration-300 hover:scale-105 ${
          !isVisible
            ? " !p-2 !h-8 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-md hover:from-blue-500/30 hover:to-indigo-500/30 shadow-md border border-white/30"
            : " !p-2 !h-8 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 backdrop-blur-md hover:from-blue-500/25 hover:to-indigo-500/25 border border-white/20"
        }`}
      >
        <Menu
          className={`h-5 w-5 transition-colors ${
            !isVisible 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-blue-600 dark:text-blue-400"
          }`}
        />
      </Button>
    );
  }

  return (
    <header 
      // initial={{ y: -100 }}
      // animate={{ y: 0 }}
      // transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b transition-all duration-300"
      style={{
        // Desktop view (lg and above) - more transparent glass effect
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(31, 41, 55, 0.6))'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(248, 250, 252, 0.35))',
        borderBottomColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0,0,0,0.15), 0 1px 0 rgba(99,102,241,0.1) inset'
          : '0 4px 20px rgba(0,0,0,0.03), 0 1px 0 rgba(255,255,255,0.5) inset',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Mobile view overlay - more solid for readability */}
      <div className="lg:hidden absolute inset-0 -z-10" style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
      }} />

      <div className="flex items-center justify-between h-full px-4 relative z-10">
        {/* Left section - Fixed width, no position change */}
        <div className="hidden lg:flex items-center gap-4" style={{ width: '16rem' }}>
          <div className="flex items-center gap-3">
            <Logo isTitle={false} />
            <div className="flex flex-col">
              <span className="text-md font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                AIMS
              </span>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
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
          <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AIMS
          </span>
        </div>

        {/* Right section - Controls with colorful buttons */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggleButton />
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}