import { useAppSelector } from '@/hooks/useRedux';
import React from 'react';

export default function Main({ children }: { children: React.ReactNode }) {
    const sidebar = useAppSelector((state) => state.sidebar);
    const isCollapsed = !sidebar.isVisible;

    return (
        <main
            className={`
                flex-grow p-4 transition-all duration-300
                bg-gradient-to-br from-white-100 via-sky-100 to-orange-100 
                dark:from-gray-800 dark:via-gray-900 dark:to-gray-800
                ${isCollapsed ? 'lg:ml-0' : 'lg:ml-64'}
            `}
            style={{ minHeight: 'calc(100vh - 5rem - 10px)', overflowY: 'auto' }}
        >
            {children}
        </main>
    );
};
