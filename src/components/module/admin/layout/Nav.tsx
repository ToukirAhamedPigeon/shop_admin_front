import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  Settings,
  History,
  SlidersHorizontal, 
  Users,
  User,
  Lock,
  Shield,
  Key,
  FileCode,
  Languages,
  ListChecks,
  Mail,
  Inbox,
  FileText,
  Database 
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Can } from "@/components/custom/Can";
import { useTranslations } from "@/hooks/useTranslations";
import { API_BASE_URL } from "@/constants/index";
import { useAppSelector } from "@/hooks/useRedux";

interface MenuItem {
  label: string;
  defaultLabel: string;
  icon?: ReactNode;
  iconName?: string;
  basePath: string;
  permissions: string[];
  children?: MenuItem[];
  external?: boolean;
}

// Menu Structure with icon names
const menuItems: MenuItem[] = [
  {
    label: "common.dashboard.title",
    defaultLabel: "Dashboard",
    icon: <LayoutDashboard size={22} className="mr-2" />,
    iconName: "LayoutDashboard",
    basePath: "/dashboard",
    permissions: ["read-admin-dashboard"],
  },
  {
    label: "common.mail.title",
    defaultLabel: "Mailbox",
    icon: <Mail size={22} className="mr-2" />,
    iconName: "Mail",
    basePath: "/mail",
    permissions: ["read-admin-mails"],
    children: [
      {
        label: "common.mail.mailbox",
        defaultLabel: "Mailbox",
        icon: <Inbox size={18} className="mr-2" />,
        iconName: "Inbox",
        basePath: "/mail",
        permissions: ["read-admin-mails"],
      },
      {
        label: "mail.templates",
        defaultLabel: "Templates",
        icon: <FileText size={18} className="mr-2" />,
        iconName: "FileText",
        basePath: "/mail/templates",
        permissions: ["read-admin-mail-templates"],
      },
    ],
  },
  {
    label: "common.settings.title",
    defaultLabel: "Settings",
    icon: <Settings size={22} className="mr-2" />,
    iconName: "Settings",
    basePath: "/settings",
    permissions: [
      "read-admin-settings",
      "read-admin-users",
      "read-admin-profile",
      "change-admin-password",
      "read-admin-roles",
      "read-admin-permissions",
      "read-admin-user-logs",
      "read-admin-backups",
      "read-admin-api-docs"
    ],
    children: [
      {
        label: "common.app_settings.title",
        defaultLabel: "App Settings",
        icon: <SlidersHorizontal size={18} className="mr-2" />,
        iconName: "SlidersHorizontal",
        basePath: "/settings/app-settings",
        permissions: ["read-admin-settings"],
      },
      {
        label: "common.users.title",
        defaultLabel: "Users",
        icon: <Users size={18} className="mr-2" />,
        iconName: "Users",
        basePath: "/settings/users",
        permissions: ["read-admin-users"],
      },
      {
        label: "common.profile.title",
        defaultLabel: "My Profile",
        icon: <User size={18} className="mr-2" />,
        iconName: "User",
        basePath: "/settings/profile",
        permissions: ["read-admin-profile"],
      },
      {
        label: "common.change_password.title",
        defaultLabel: "Change Password",
        icon: <Lock size={18} className="mr-2" />,
        iconName: "Lock",
        basePath: "/settings/change-password",
        permissions: ["change-admin-password"],
      },
      {
        label: "common.roles.title",
        defaultLabel: "Roles",
        icon: <Shield size={18} className="mr-2" />,
        iconName: "Shield",
        basePath: "/settings/roles",
        permissions: ["read-admin-roles"],
      },
      {
        label: "common.permissions.title",
        defaultLabel: "Permissions",
        icon: <Key size={18} className="mr-2" />,
        iconName: "Key",
        basePath: "/settings/permissions",
        permissions: ["read-admin-permissions"],
      },
      {
        label: "common.options.title",
        defaultLabel: "Options",
        icon: <ListChecks size={18} className="mr-2" />,
        iconName: "ListChecks",
        basePath: "/settings/options",
        permissions: ["read-admin-options"],
      },
      {
        label: "common.translations.title",
        defaultLabel: "Translations",
        icon: <Languages size={18} className="mr-2" />,
        iconName: "Languages",
        basePath: "/settings/translations",
        permissions: ["read-admin-translations"],
      },
      {
        label: "common.user_logs.title",
        defaultLabel: "User Logs",
        icon: <History size={18} className="mr-2" />,
        iconName: "History",
        basePath: "/settings/user-logs",
        permissions: ["read-admin-user-logs"],
      },
      {
        label: "common.backup.title",
        defaultLabel: "Backup",
        icon: <Database size={18} className="mr-2" />,
        iconName: "Database",
        basePath: "/backup",
        permissions: ["read-admin-backups"],
      },
      {
        label: "common.api_docs.title",
        defaultLabel: "API Documentation",
        icon: <FileCode size={18} className="mr-2" />,
        iconName: "FileCode",
        basePath: `${API_BASE_URL}/swagger`,
        permissions: ["read-admin-api-docs"],
        external: true,
      },
    ],
  },
];

export default function Nav({ onLinkClick }: { onLinkClick?: () => void }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { t } = useTranslations();
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActiveMenu = (basePath: string) =>
    location.pathname.startsWith(basePath);
  const isActiveSubmenu = (path: string) => location.pathname === path;

  // Check if any child is active
  const hasActiveChild = (children?: MenuItem[]): boolean => {
    if (!children) return false;
    return children.some(child => 
      isActiveMenu(child.basePath) || hasActiveChild(child.children)
    );
  };

  // Multi-color icon mapping for ALL menu items
  const getIconColor = (iconName: string | undefined, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      LayoutDashboard: { active: "text-blue-600", inactive: "text-blue-500" },
      Mail: { active: "text-sky-600", inactive: "text-sky-500" },
      Inbox: { active: "text-sky-600", inactive: "text-sky-500" },
      FileText: { active: "text-violet-600", inactive: "text-violet-500" },
      Settings: { active: "text-purple-600", inactive: "text-purple-500" },
      SlidersHorizontal: { active: "text-indigo-600", inactive: "text-indigo-500" },
      Users: { active: "text-cyan-600", inactive: "text-cyan-500" },
      User: { active: "text-teal-600", inactive: "text-teal-500" },
      Lock: { active: "text-amber-600", inactive: "text-amber-500" },
      Shield: { active: "text-rose-600", inactive: "text-rose-500" },
      Key: { active: "text-yellow-600", inactive: "text-yellow-500" },
      Languages: { active: "text-pink-600", inactive: "text-pink-500" },
      ListChecks: { active: "text-green-600", inactive: "text-green-500" },
      History: { active: "text-orange-600", inactive: "text-orange-500" },
      FileCode: { active: "text-gray-600", inactive: "text-gray-500" },
      Database: { active: "text-blue-600", inactive: "text-blue-500" },
    };
    
    const defaultColor = isActive 
      ? (isDarkMode ? "text-white" : "text-gray-800")
      : (isDarkMode ? "text-gray-400" : "text-[#282d34]");
    
    const colorSet = colors[iconName || ""];
    if (colorSet) {
      return isActive ? colorSet.active : colorSet.inactive;
    }
    return defaultColor;
  };

  // Premium classes for menu items
  const getLevelClasses = (level: number, isActive: boolean) => {
    if (level === 0) {
      if (isActive) {
        return isDarkMode
          ? "bg-gradient-to-r from-primary-600/50 to-purple-600/50 text-white font-semibold shadow-lg backdrop-blur-sm"
          : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-gray-800 font-semibold backdrop-blur-sm";
      }
      return isDarkMode
        ? "text-gray-300 hover:bg-white/10 hover:text-white"
        : "text-[#282d34] hover:bg-gray-100/50 hover:text-gray-900";
    }

    // Level >= 1 (submenu)
    if (isActive) {
      return isDarkMode
        ? "bg-gradient-to-r from-primary-500/15 to-purple-500/15 text-primary-300 font-semibold backdrop-blur-sm"
        : "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 text-gray-800 font-semibold border-l-2 border-blue-500";
    }
    return isDarkMode
      ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
      : "text-[#282d34] hover:bg-gray-50/50 hover:text-gray-800";
  };

  const renderMenu = (items: MenuItem[], level = 0) => (
    <div className={level > 0 ? "ml-3 space-y-0.5" : "space-y-0.5"}>
      {items.map(({ label, defaultLabel, icon, iconName, basePath, children, permissions, external }) => {
        const isParentActive = isActiveMenu(basePath);
        const hasChildActive = hasActiveChild(children);
        const isOpen = openMenus.includes(label) || isParentActive || hasChildActive;
        
        // For parent items, check if any child is active
        const shouldBeActive = level === 0 ? (isParentActive || hasChildActive) : isActiveSubmenu(basePath);

        return (
          <Can anyOf={permissions} key={label}>
            <div className="space-y-0.5">
              {children && children.length > 0 ? (
                <button
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all duration-200 rounded-xl cursor-pointer
                    ${getLevelClasses(level, shouldBeActive)}`}
                  onClick={() => toggleMenu(label)}
                >
                  <span className="flex items-center gap-2.5 text-sm">
                    {icon && (
                      <span className={`flex-shrink-0 transition-all duration-200 ${getIconColor(iconName, shouldBeActive)}`}>
                        {icon}
                      </span>
                    )}
                    <span className={shouldBeActive ? "font-semibold" : ""}>{t(label, defaultLabel)}</span>
                  </span>
                  <span className="flex-shrink-0">
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
              ) : external ? (
                <a
                  href={basePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onLinkClick}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-all duration-200 cursor-pointer
                    ${getLevelClasses(level, isActiveSubmenu(basePath))}`}
                >
                  {icon && (
                    <span className={`flex-shrink-0 transition-all duration-200 ${getIconColor(iconName, isActiveSubmenu(basePath))}`}>
                      {icon}
                    </span>
                  )}
                  <span>{t(label, defaultLabel)}</span>
                </a>
              ) : (
                <Link
                  to={basePath}
                  onClick={onLinkClick}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-all duration-200 cursor-pointer
                    ${getLevelClasses(level, isActiveSubmenu(basePath))}`}
                >
                  {icon && (
                    <span className={`flex-shrink-0 transition-all duration-200 ${getIconColor(iconName, isActiveSubmenu(basePath))}`}>
                      {icon}
                    </span>
                  )}
                  <span className={isActiveSubmenu(basePath) ? "font-semibold" : ""}>{t(label, defaultLabel)}</span>
                </Link>
              )}

              <AnimatePresence initial={false}>
                {isOpen && children && children.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
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

  return <nav className="px-3 py-4">{renderMenu(menuItems)}</nav>;
}