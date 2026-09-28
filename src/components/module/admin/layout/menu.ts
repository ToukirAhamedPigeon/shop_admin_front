// src/components/module/admin/layout/menu.ts
// The admin navigation, shared by the sidebar, its collapsed icon rail and
// the command palette.
import {
  BookMarked,
  BookOpen,
  Database,
  FileCode,
  FileText,
  GitCommitHorizontal,
  History,
  Inbox,
  Key,
  Languages,
  LayoutDashboard,
  ListChecks,
  Lock,
  Mail,
  Settings,
  Shield,
  SlidersHorizontal,
  User,
  Users,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { API_BASE_URL } from "@/constants/index";

export interface MenuItem {
  label: string;
  defaultLabel: string;
  icon: LucideIcon;
  basePath: string;
  /** Shown when the user has any of these. */
  permissions: string[];
  children?: MenuItem[];
  external?: boolean;
}

export const menuItems: MenuItem[] = [
  {
    label: "common.dashboard.title",
    defaultLabel: "Dashboard",
    icon: LayoutDashboard,
    basePath: "/dashboard",
    permissions: ["read-admin-dashboard"],
  },
  {
    label: "common.mail.title",
    defaultLabel: "Mailbox",
    icon: Mail,
    basePath: "/mail",
    permissions: ["read-admin-mails"],
    children: [
      { label: "common.mail.mailbox", defaultLabel: "Mailbox", icon: Inbox, basePath: "/mail", permissions: ["read-admin-mails"] },
      { label: "mail.templates", defaultLabel: "Templates", icon: FileText, basePath: "/mail/templates", permissions: ["read-admin-mail-templates"] },
    ],
  },
  {
    label: "common.documentation.title",
    defaultLabel: "Documentation",
    icon: BookOpen,
    basePath: "/docs",
    permissions: ["read-admin-doc-developer", "read-admin-doc-user-guide"],
    children: [
      { label: "common.documentation.developer", defaultLabel: "Developer Guide", icon: BookMarked, basePath: "/docs/developer", permissions: ["read-admin-doc-developer"] },
      { label: "common.documentation.user_guide", defaultLabel: "User Guide", icon: BookOpen, basePath: "/docs/guide", permissions: ["read-admin-doc-user-guide"] },
      { label: "common.documentation.changelog", defaultLabel: "Changelog", icon: GitCommitHorizontal, basePath: "/docs/changelog", permissions: ["read-admin-doc-developer"] },
    ],
  },
  {
    label: "common.settings.title",
    defaultLabel: "Settings",
    icon: Settings,
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
      "read-admin-api-docs",
    ],
    children: [
      { label: "common.app_settings.title", defaultLabel: "App Settings", icon: SlidersHorizontal, basePath: "/settings/app-settings", permissions: ["read-admin-settings"] },
      { label: "common.users.title", defaultLabel: "Users", icon: Users, basePath: "/settings/users", permissions: ["read-admin-users"] },
      { label: "common.profile.title", defaultLabel: "My Profile", icon: User, basePath: "/settings/profile", permissions: ["read-admin-profile"] },
      { label: "common.change_password.title", defaultLabel: "Change Password", icon: Lock, basePath: "/settings/change-password", permissions: ["change-admin-password"] },
      { label: "common.roles.title", defaultLabel: "Roles", icon: Shield, basePath: "/settings/roles", permissions: ["read-admin-roles"] },
      { label: "common.permissions.title", defaultLabel: "Permissions", icon: Key, basePath: "/settings/permissions", permissions: ["read-admin-permissions"] },
      { label: "common.permission_groups.title", defaultLabel: "Permission Groups", icon: Layers, basePath: "/settings/permission-groups", permissions: ["read-admin-permissions"] },
      { label: "common.options.title", defaultLabel: "Options", icon: ListChecks, basePath: "/settings/options", permissions: ["read-admin-options"] },
      { label: "common.translations.title", defaultLabel: "Translations", icon: Languages, basePath: "/settings/translations", permissions: ["read-admin-translations"] },
      { label: "common.user_logs.title", defaultLabel: "User Logs", icon: History, basePath: "/settings/user-logs", permissions: ["read-admin-user-logs"] },
      { label: "common.backup.title", defaultLabel: "Backup", icon: Database, basePath: "/backup", permissions: ["read-admin-backups"] },
      {
        label: "common.api_docs.title",
        defaultLabel: "API Documentation",
        icon: FileCode,
        basePath: `${API_BASE_URL}/swagger`,
        permissions: ["read-admin-api-docs"],
        external: true,
      },
    ],
  },
];

/** The menu trimmed to what `permissions` allow; parents left with no children are dropped. */
export function visibleMenu(permissions: string[], items: MenuItem[] = menuItems): MenuItem[] {
  return items.flatMap((item) => {
    if (!item.permissions.some((p) => permissions.includes(p))) return [];
    if (!item.children) return [item];
    const children = visibleMenu(permissions, item.children);
    return children.length ? [{ ...item, children }] : [];
  });
}

/** Most specific match wins, so /mail/templates doesn't also light up /mail. */
export function activePath(pathname: string, items: MenuItem[]): string | undefined {
  const leaves = items.flatMap((i) => (i.children ? i.children : [i])).filter((i) => !i.external);
  return leaves
    .filter((i) => pathname === i.basePath || pathname.startsWith(i.basePath + "/"))
    .sort((a, b) => b.basePath.length - a.basePath.length)[0]?.basePath;
}
