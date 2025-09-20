// src/components/layout/Nav.tsx
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  // ChartBar,
  // Settings,
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

// ==========================
// Menu Structure (Multilevel)
// ==========================
const menuItems: MenuItem[] = [
  {
    label: "common.dashboard.title",
    icon: <LayoutDashboard size={22} className="mr-2" />,
    basePath: "/dashboard",
    permissions: ["read-admin-dashboard"],
    // children: [
    //   {
    //     label: "Analytics",
    //     icon: <ChartBar size={22} className="mr-2" />,
    //     basePath: "/admin/dashboard/analytics",
    //     permissions: ["read-admin-dashboard"],
    //     children: [
    //       {
    //         label: "Sales Report",
    //         icon: <ChartBar size={22} className="mr-2" />,
    //         basePath: "/admin/dashboard/analytics/sales",
    //         permissions: ["read-admin-dashboard"],
    //       },
    //       {
    //         label: "User Activity",
    //         icon: <ChartBar size={22} className="mr-2" />,
    //         basePath: "/admin/dashboard/analytics/users",
    //         permissions: ["read-admin-dashboard"],
    //       },
    //     ],
    //   },
    //   {
    //     label: "Settings",
    //     icon: <Settings size={22} className="mr-2" />,
    //     basePath: "/admin/dashboard/settings",
    //     permissions: ["read-admin-dashboard"],
    //   },
    // ],
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

  // ✅ Define text colors per level (only for menus/submenus)
  const getLevelClasses = (level: number) => {
    switch (level) {
      case 0:
        return "text-gray-200"; // top-level menu
      case 1:
        return "text-gray-300"; // submenu
      default:
        return "text-gray-400"; // deeper submenu
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
              {/* ========== Parent menu with children ========== */}
              {children && children.length > 0 ? (
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all rounded cursor-pointer
                    ${
                      alwaysOpen
                        ? "bg-primary/60 text-gray-100 font-semibold"
                        : `${getLevelClasses(level)} hover:bg-white/10`
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
                /* ========== Leaf menu (link → brighter text) ========== */
                <Link
                  to={basePath}
                  onClick={onLinkClick}
                  className={`block px-4 py-2 text-sm rounded transition-all pl-6 border-l-2 cursor-pointer
                    ${
                      isActiveSubmenu(basePath)
                        ? "bg-primary/60 text-gray-50 font-semibold border-primary"
                        : "text-gray-50 hover:bg-white/10 border-transparent" // brighter text for links
                    }`}
                >
                  <span className="flex items-center gap-2 cursor-pointer">
                    {icon}
                    {t(label)}
                  </span>
                </Link>
              )}

              {/* Animate children */}
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
