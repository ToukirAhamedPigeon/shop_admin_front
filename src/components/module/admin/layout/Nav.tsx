import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
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
  Database,
  BookOpen,
  BookMarked,
  GitCommitHorizontal
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Can } from "@/components/custom/Can";
import { useTranslations } from "@/hooks/useTranslations";
import { API_BASE_URL } from "@/constants/index";

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
    icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
    iconName: "LayoutDashboard",
    basePath: "/dashboard",
    permissions: ["read-admin-dashboard"],
  },
  {
    label: "common.mail.title",
    defaultLabel: "Mailbox",
    icon: <Mail size={18} strokeWidth={1.75} />,
    iconName: "Mail",
    basePath: "/mail",
    permissions: ["read-admin-mails"],
    children: [
      {
        label: "common.mail.mailbox",
        defaultLabel: "Mailbox",
        icon: <Inbox size={16} strokeWidth={1.75} />,
        iconName: "Inbox",
        basePath: "/mail",
        permissions: ["read-admin-mails"],
      },
      {
        label: "mail.templates",
        defaultLabel: "Templates",
        icon: <FileText size={16} strokeWidth={1.75} />,
        iconName: "FileText",
        basePath: "/mail/templates",
        permissions: ["read-admin-mail-templates"],
      },
    ],
  },
  {
    label: "common.documentation.title",
    defaultLabel: "Documentation",
    icon: <BookOpen size={18} strokeWidth={1.75} />,
    iconName: "BookOpen",
    basePath: "/docs",
    permissions: ["read-admin-doc-developer", "read-admin-doc-user-guide"],
    children: [
      {
        label: "common.documentation.developer",
        defaultLabel: "Developer Guide",
        icon: <BookMarked size={16} strokeWidth={1.75} />,
        iconName: "BookMarked",
        basePath: "/docs/developer",
        permissions: ["read-admin-doc-developer"],
      },
      {
        label: "common.documentation.user_guide",
        defaultLabel: "User Guide",
        icon: <BookOpen size={16} strokeWidth={1.75} />,
        iconName: "BookOpen",
        basePath: "/docs/guide",
        permissions: ["read-admin-doc-user-guide"],
      },
      {
        label: "common.documentation.changelog",
        defaultLabel: "Changelog",
        icon: <GitCommitHorizontal size={16} strokeWidth={1.75} />,
        iconName: "GitCommitHorizontal",
        basePath: "/docs/changelog",
        permissions: ["read-admin-doc-developer"],
      },
    ],
  },
  {
    label: "common.settings.title",
    defaultLabel: "Settings",
    icon: <Settings size={18} strokeWidth={1.75} />,
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
        icon: <SlidersHorizontal size={16} strokeWidth={1.75} />,
        iconName: "SlidersHorizontal",
        basePath: "/settings/app-settings",
        permissions: ["read-admin-settings"],
      },
      {
        label: "common.users.title",
        defaultLabel: "Users",
        icon: <Users size={16} strokeWidth={1.75} />,
        iconName: "Users",
        basePath: "/settings/users",
        permissions: ["read-admin-users"],
      },
      {
        label: "common.profile.title",
        defaultLabel: "My Profile",
        icon: <User size={16} strokeWidth={1.75} />,
        iconName: "User",
        basePath: "/settings/profile",
        permissions: ["read-admin-profile"],
      },
      {
        label: "common.change_password.title",
        defaultLabel: "Change Password",
        icon: <Lock size={16} strokeWidth={1.75} />,
        iconName: "Lock",
        basePath: "/settings/change-password",
        permissions: ["change-admin-password"],
      },
      {
        label: "common.roles.title",
        defaultLabel: "Roles",
        icon: <Shield size={16} strokeWidth={1.75} />,
        iconName: "Shield",
        basePath: "/settings/roles",
        permissions: ["read-admin-roles"],
      },
      {
        label: "common.permissions.title",
        defaultLabel: "Permissions",
        icon: <Key size={16} strokeWidth={1.75} />,
        iconName: "Key",
        basePath: "/settings/permissions",
        permissions: ["read-admin-permissions"],
      },
      {
        label: "common.options.title",
        defaultLabel: "Options",
        icon: <ListChecks size={16} strokeWidth={1.75} />,
        iconName: "ListChecks",
        basePath: "/settings/options",
        permissions: ["read-admin-options"],
      },
      {
        label: "common.translations.title",
        defaultLabel: "Translations",
        icon: <Languages size={16} strokeWidth={1.75} />,
        iconName: "Languages",
        basePath: "/settings/translations",
        permissions: ["read-admin-translations"],
      },
      {
        label: "common.user_logs.title",
        defaultLabel: "User Logs",
        icon: <History size={16} strokeWidth={1.75} />,
        iconName: "History",
        basePath: "/settings/user-logs",
        permissions: ["read-admin-user-logs"],
      },
      {
        label: "common.backup.title",
        defaultLabel: "Backup",
        icon: <Database size={16} strokeWidth={1.75} />,
        iconName: "Database",
        basePath: "/backup",
        permissions: ["read-admin-backups"],
      },
      {
        label: "common.api_docs.title",
        defaultLabel: "API Documentation",
        icon: <FileCode size={16} strokeWidth={1.75} />,
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

  // Icons stay muted; only the active leaf picks up the primary accent.
  const getIconColor = (_iconName: string | undefined, isActive: boolean) =>
    isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground";

  // Flat, token-driven item states. A parent whose child is active is only
  // emphasised typographically so the highlight lives on a single row.
  const getLevelClasses = (level: number, isActive: boolean, isParent = false) => {
    if (isParent) {
      return isActive
        ? "text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
    }
    if (isActive) {
      return "bg-sidebar-accent text-primary font-medium";
    }
    return level === 0
      ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  };

  const renderMenu = (items: MenuItem[], level = 0) => (
    <div className={level > 0 ? "ml-[18px] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2.5" : "space-y-0.5"}>
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
                  className={`group w-full flex items-center justify-between px-3 py-2 text-left transition-colors duration-150 rounded-lg cursor-pointer
                    ${getLevelClasses(level, shouldBeActive, true)}`}
                  onClick={() => toggleMenu(label)}
                >
                  <span className="flex items-center gap-2.5 text-sm">
                    {icon && (
                      <span className={`flex-shrink-0 transition-colors duration-150 ${shouldBeActive ? "text-sidebar-accent-foreground" : getIconColor(iconName, false)}`}>
                        {icon}
                      </span>
                    )}
                    <span>{t(label, defaultLabel)}</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              ) : external ? (
                <a
                  href={basePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onLinkClick}
                  className={`group flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors duration-150 cursor-pointer
                    ${getLevelClasses(level, isActiveSubmenu(basePath))}`}
                >
                  {icon && (
                    <span className={`flex-shrink-0 transition-colors duration-150 ${getIconColor(iconName, isActiveSubmenu(basePath))}`}>
                      {icon}
                    </span>
                  )}
                  <span>{t(label, defaultLabel)}</span>
                </a>
              ) : (
                <Link
                  to={basePath}
                  onClick={onLinkClick}
                  className={`group flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors duration-150 cursor-pointer
                    ${getLevelClasses(level, isActiveSubmenu(basePath))}`}
                >
                  {icon && (
                    <span className={`flex-shrink-0 transition-colors duration-150 ${getIconColor(iconName, isActiveSubmenu(basePath))}`}>
                      {icon}
                    </span>
                  )}
                  <span className="truncate">{t(label, defaultLabel)}</span>
                </Link>
              )}

              <AnimatePresence initial={false}>
                {isOpen && children && children.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
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
