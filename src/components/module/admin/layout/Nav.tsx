'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronUp, ChevronDown, LayoutDashboard, Users, UserCog, UserCheck, History, ListFilter } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {Can} from '@/components/custom/Can';
import { useTranslations } from 'next-intl';

const menuItems = [
  { label: 'Dashboard', icon: <LayoutDashboard size={22} className="mr-2" />, basePath: '/admin/dashboard', children: [], permissions: ['read-dashboard'] },
  {label: 'Lookups', icon: <ListFilter size={22} className="mr-2" />, basePath: '/admin/lookups', children: [], permissions: ['read-lookups']},
  { label: 'Users', icon: <Users size={22} className="mr-2" />, basePath: '/admin/users', children: [], permissions: ['read-users'] },
  { label: 'Roles', icon: <UserCog size={22} className="mr-2" />, basePath: '/admin/roles', children: [], permissions: ['read-roles'] },
  { label: 'Permissions', icon: <UserCheck size={22} className="mr-2" />, basePath: '/admin/permissions', children: [], permissions: ['read-permissions'] },
  {label: 'Logs', icon: <History size={22} className="mr-2" />, basePath: '/admin/logs', children: [], permissions: ['read-logs']}
];

export default function Nav({ onLinkClick }: { onLinkClick?: () => void }) {

  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const t = useTranslations();

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const isActiveMenu = (basePath: string) => pathname?.startsWith(basePath);
  const isActiveSubmenu = (path: string) => pathname === path;

  return (
    <nav className="space-y-0 py-6 text-gray-600">
      {menuItems.map(({ label, icon, basePath, children, permissions }) => {
        const alwaysOpen = isActiveMenu(basePath);
        const isOpen = openMenus.includes(label) || alwaysOpen;

        return (
          <Can anyOf={permissions} key={label}>
            <div>
              {children?.length > 0 ? (
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 text-left bg-white/10 hover:bg-white/80 border-b border-white transition-all 
                    ${alwaysOpen ? 'main-link-gradient text-white font-semibold' : ''}`}
                  onClick={() => toggleMenu(label)}
                >
                  <span><div className='flex flex-row text-sm'>{icon} {t(label)}</div></span>
                  <span>{isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                </button>
              ) : (
                <Link
                  href={basePath}
                  onClick={onLinkClick}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left text-white bg-transparent hover:bg-white/20  transition-all
                    ${alwaysOpen ? 'main-link-gradient text-white font-semibold' : ''}`}
                >
                  <span><div className='flex flex-row text-sm'>{icon} {t(label)}</div></span>
                </Link>
              )}

              <AnimatePresence initial={false}>
                {isOpen && children?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="ml-6 overflow-hidden"
                  >
                    {children.map(({ label: subLabel, basePath: subPath }) => (
                      <Link
                        key={subLabel}
                        href={subPath}
                        onClick={onLinkClick}
                        className={`block px-4 py-2 bg-white/20 hover:bg-white/50  transition-all 
                          ${isActiveSubmenu(subPath) ? 'bg-blue-200 hover:bg-blue-300 text-blue-600 font-semibold' : ''}`}
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <ChevronRight className="w-4 h-4" /> {subLabel}
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Can>
        );
      })}
    </nav>
  );
}
