import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Can } from "@/components/custom/Can";
import { useTranslations } from "@/hooks/useTranslations";

interface MenuItem {
  label: string;
  icon?: ReactNode;
  basePath: string;
  permissions: string[];
  children?: MenuItem[];
}

// Menu Structure
const menuItems: MenuItem[] = [
  {
    label: "common.dashboard.title",
    icon: <LayoutDashboard size={22} className="mr-2" />,
    basePath: "/dashboard",
    permissions: ["read-admin-dashboard"],
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
  const getLevelClasses = (level: number) => {
    switch (level) {
      case 0:
        return "text-gray-200 dark:text-gray-100";
      case 1:
        return "text-gray-300 dark:text-gray-200";
      default:
        return "text-gray-400 dark:text-gray-300";
    }
  };

  const renderMenu = (items: MenuItem[], level = 0) => (
    <div className={level > 0 ? "ml-4" : ""}>
      {items.map(({ label, icon, basePath, children, permissions }) => {
        const alwaysOpen = isActiveMenu(basePath);
        const isOpen = openMenus.includes(label) || alwaysOpen;

        return (
          <Can anyOf={permissions} key={label}>
            <div>
              {children && children.length > 0 ? (
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all rounded cursor-pointer
                    ${
                      alwaysOpen
                        ? "bg-primary/60 text-gray-100 dark:text-gray-50 font-semibold"
                        : `${getLevelClasses(level)} hover:bg-white/10 dark:hover:bg-gray-700/30`
                    }`}
                  onClick={() => toggleMenu(label)}
                >
                  <span>
                    <div className="flex flex-row text-sm items-center cursor-pointer">
                      {icon} {t(label)}
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
                        ? "bg-primary/60 text-gray-50 dark:text-gray-50 font-semibold border-primary"
                        : "text-gray-50 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30 border-transparent"
                    }`}
                >
                  <span className="flex items-center gap-2 cursor-pointer">
                    {icon}
                    {t(label)}
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
