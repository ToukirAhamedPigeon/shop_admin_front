import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  Settings,
  History,
  SlidersHorizontal 
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Can } from "@/components/custom/Can";
import { useTranslations } from "@/hooks/useTranslations";

interface MenuItem {
  label: string;
  defaultLabel: string;
  icon?: ReactNode;
  basePath: string;
  permissions: string[];
  children?: MenuItem[];
}

// Menu Structure
const menuItems: MenuItem[] = [
  {
    label: "common.dashboard.title",
    defaultLabel: "Dashboard",
    icon: <LayoutDashboard size={22} className="mr-2" />,
    basePath: "/dashboard",
    permissions: ["read-admin-dashboard"],
  },
  {
    label: "common.settings.title",
    defaultLabel: "Settings",
    icon: <Settings size={22} className="mr-2" />,
    basePath: "/settings",
    permissions: [
      // "read-admin-settings"
      "read-admin-dashboard"
    ],
    children: [
      {
        label: "common.app_settings.title",
        defaultLabel: "App Settings",
        icon: <SlidersHorizontal size={18} className="mr-2" />,
        basePath: "/settings/app-settings",
        permissions: [
          // "read-admin-user-logs"
          "read-admin-dashboard"
        ],
      },
      {
        label: "common.user_logs.title",
        defaultLabel: "User Logs",
        icon: <History size={18} className="mr-2" />,
        basePath: "/settings/user-logs",
        permissions: [
          // "read-admin-user-logs"
          "read-admin-dashboard"
        ],
      },
    ],
  },
];

export default function Nav({ onLinkClick }: { onLinkClick?: () => void }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { t } = useTranslations();

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActiveMenu = (basePath: string) =>
    location.pathname.startsWith(basePath);
  const isActiveSubmenu = (path: string) => location.pathname === path;

  // Dark/light text colors per level
  const getLevelClasses = (level: number, isActive: boolean) => {
    if (level === 0) {
      return isActive
        ? "bg-primary/60 text-gray-100 dark:text-gray-50 font-semibold"
        : "text-gray-200 dark:text-gray-100 hover:bg-white/10 dark:hover:bg-gray-700/30";
    }

    // Level >= 1 (submenu)
    return isActive
      ? "text-primary font-semibold bg-white/40 dark:bg-black/20"
      : "text-gray-300 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-black/20";
  };

  const renderMenu = (items: MenuItem[], level = 0) => (
    <div className={level > 0 ? "ml-4" : ""}>
      {items.map(({ label, defaultLabel, icon, basePath, children, permissions }) => {
        const alwaysOpen = isActiveMenu(basePath);
        const isOpen = openMenus.includes(label) || alwaysOpen;

        return (
          <Can anyOf={permissions} key={label}>
            <div  className="space-y-1">
              {children && children.length > 0 ? (
                <button
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all rounded cursor-pointer
                      ${getLevelClasses(level, alwaysOpen)}`}
                    onClick={() => toggleMenu(label)}
                  >
                  <span>
                    <div className="flex flex-row text-sm items-center cursor-pointer">
                      {icon} {t(label,defaultLabel)}
                    </div>
                  </span>
                  <span className="cursor-pointer">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>
              ) : (
                <Link
                    to={basePath}
                    onClick={onLinkClick}
                    className={`block px-4 py-2 text-sm rounded transition-all pl-6 border-l-2 cursor-pointer
                      ${
                        isActiveSubmenu(basePath)
                          ? "text-primary font-semibold bg-white/70 dark:bg-black/20 border-primary"
                          : "text-gray-50 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-black/20 border-transparent"
                      }`}
                  >
                  <span className="flex items-center gap-2 cursor-pointer">
                    {icon}
                    {t(label,defaultLabel)}
                  </span>
                </Link>
              )}

              <AnimatePresence initial={false}>
                {isOpen && children && children.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="ml-2 overflow-hidden"
                  >
                    {renderMenu(children, level + 1)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Can>
        );
      })}
    </div>
  );

  return <nav className="space-y-0 py-6">{renderMenu(menuItems)}</nav>;
}
