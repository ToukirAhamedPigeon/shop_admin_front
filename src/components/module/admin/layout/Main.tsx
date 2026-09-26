import { useAppSelector } from '@/hooks/useRedux';
import React from 'react';

export default function Main({ children }: { children: React.ReactNode }) {
  const sidebar = useAppSelector((state) => state.sidebar);
  const isCollapsed = !sidebar.isVisible;

  return (
    <main
      className={`relative flex-1 min-w-0 bg-background transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </main>
  );
}
