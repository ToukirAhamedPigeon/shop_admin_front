'use client';

import React from 'react';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import SidebarMobileSheet from './SidebarMobileSheet';
import { useAppDispatch } from '@/hooks/useRedux';
import { toggleSidebar } from '@/store/sidebarSlice';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/custom/LanguageSwitcher';


export default function Header(){
    function ToggleSidebarButton() {
        const dispatch = useAppDispatch();
        const toggleCollapse = () => {
          dispatch(toggleSidebar());
        };
        return (
          <Button variant="link" onClick={toggleCollapse} className=''>
            <Menu className="h-6 w-6 text-white" />
          </Button>
        )
      }
    return (
        <nav className="w-full flex items-center justify-between pl-4 py-0 fixed top-0 z-20 shadow-md main-gradient text-white h-16">
            <div className="flex items-center gap-2 py-4">
                <SidebarMobileSheet />
                <div className="hidden lg:flex items-center gap-2 lg:justify-between w-60">
                  <Logo isTitle titleClassName="" />
                  <ToggleSidebarButton />
                  
                </div>
                <div className="hidden lg:flex items-center gap-2 lg:justify-between w-60">
                  <LanguageSwitcher/>
                </div>
            </div>
            <Logo isTitle={false} className="lg:hidden py-4" />
            <div className="flex items-center gap-2 h-full px-4 bg-white/30 backdrop-blur-sm text-gray-800">
                <UserDropdown />
            </div>
        </nav>
    );
};