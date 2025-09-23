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
      <Button variant="link" onClick={toggleCollapse}>
        <Menu className="h-6 w-6 text-white dark:text-gray-200 transition-colors" />
      </Button>
    );
  }

  return (
    <nav className="w-full flex items-center justify-between pl-4 py-0 fixed top-0 z-20 shadow-md main-gradient text-white dark:text-gray-200 h-16 transition-colors duration-300">
      <div className="flex items-center gap-2 py-4">
        {/* Mobile Sidebar */}
        <SidebarMobileSheet />

        {/* Logo + Toggle (desktop) */}
        <div className="hidden lg:flex items-center gap-2 lg:justify-between w-60">
          <Logo isTitle titleClassName="text-gray-800 dark:text-gray-100" />
          <ToggleSidebarButton />
        </div>

        {/* Language + Theme Toggle (desktop) */}
        <div className="hidden lg:flex items-center gap-2 lg:justify-start w-60">
          <LanguageSwitcher />
          <ThemeToggleButton />
        </div>
      </div>

      {/* Logo (mobile) */}
      <Logo isTitle={false} className="lg:hidden py-4 text-gray-800 dark:text-gray-100" />

      {/* User Dropdown */}
      <div className="flex items-center gap-2 h-full px-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm text-gray-800 dark:text-gray-200 transition-colors duration-300 rounded-l-xl">
        <UserDropdown />
      </div>
    </nav>
  );
}
