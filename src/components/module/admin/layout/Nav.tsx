// src/components/layout/Nav.tsx
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

// ==========================
// Menu Structure (Multilevel)
// ==========================
const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard size={22} className="mr-2" />,
    basePath: "/admin/dashboard",
    permissions: ["read-dashboard"],
    children: [
      {
        label: "Analytics",
        basePath: "/admin/dashboard/analytics",
        permissions: ["read-dashboard"],
        children: [
          {
            label: "Sales Report",
            basePath: "/admin/dashboard/analytics/sales",
            permissions: ["read-dashboard"],
          },
          {
            label: "User Activity",
            basePath: "/admin/dashboard/analytics/users",
            permissions: ["read-dashboard"],
          },
        ],
      },
      {
        label: "Settings",
        basePath: "/admin/dashboard/settings",
        permissions: ["read-dashboard"],
      },
    ],
  },

  // ==========================
  // Commented out for now
  // ==========================
  // { label: "Users", icon: <Users size={22} className="mr-2" />, basePath: "/admin/users", children: [], permissions: ["read-users"] },
  // { label: "Roles", icon: <UserCog size={22} className="mr-2" />, basePath: "/admin/roles", children: [], permissions: ["read-roles"] },
  // { label: "Permissions", icon: <UserCheck size={22} className="mr-2" />, basePath: "/admin/permissions", children: [], permissions: ["read-permissions"] },
  // { label: "Logs", icon: <History size={22} className="mr-2" />, basePath: "/admin/logs", children: [], permissions: ["read-logs"] },
];

export default function Nav({ onLinkClick }: { onLinkClick?: () => void }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { t } = useTranslations();

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const isActiveMenu = (basePath: string) =>
    location.pathname.startsWith(basePath);
  const isActiveSubmenu = (path: string) => location.pathname === path;

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
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all
                    ${alwaysOpen ? "main-link-gradient text-white font-semibold" : "text-gray-700 hover:bg-white/20"}`}
                  onClick={() => toggleMenu(label)}
                >
                  <span>
                    <div className="flex flex-row text-sm">
                      {icon} {t(label)}
                    </div>
                  </span>
                  <span>
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
                  className={`block px-4 py-2 text-sm transition-all 
                    ${
                      isActiveSubmenu(basePath)
                        ? "bg-blue-200 hover:bg-blue-300 text-blue-600 font-semibold"
                        : "text-gray-700 hover:bg-white/20"
                    }`}
                >
                  <span className="flex items-center gap-2">
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
                    className="ml-4 overflow-hidden"
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
