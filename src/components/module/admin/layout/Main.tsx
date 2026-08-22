import { useAppSelector } from '@/hooks/useRedux';
import React from 'react';

export default function Main({ children }: { children: React.ReactNode }) {
  const sidebar = useAppSelector((state) => state.sidebar);
  const isCollapsed = !sidebar.isVisible;

  return (
    <main
      className={`relative flex-grow bg-background transition-all duration-500 ease-out ${isCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      {/* Content */}
      <div className="relative z-10 p-4 md:p-6">
        {children}
      </div>
    </main>
  );
}
