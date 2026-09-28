// src/modules/dashboard/components/AccountCard.tsx
import { Link } from "react-router-dom";
import { ChevronRight, KeyRound, Lock, Mail, Phone, ShieldCheck, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { assetUrl } from "@/lib/assetUrl";
import { initialsOf } from "@/lib/initials";
import { useTranslations } from "@/hooks/useTranslations";
import type { User } from "@/modules/auth/types";
import Panel from "./Panel";

export default function AccountCard({ user, className }: { user: User | null; className?: string }) {
  const { t } = useTranslations();
  const roles: string[] = user?.roles ?? [];
  const permissions = (user?.permissions as string[] | undefined) ?? [];
  const permissionCount = permissions.length;
  const canChangePassword = permissions.includes("change-admin-password");
  const initials = initialsOf(user?.name ?? "A");

  const rows: { icon: LucideIcon; label: string; value?: string }[] = [
    { icon: Mail, label: t("common.email", "Email"), value: user?.email },
    { icon: Phone, label: t("common.mobileNo", "Mobile"), value: user?.mobileNo },
  ];

  return (
    <Panel
      className={className}
      title={t("dashboard.account.title", "Your account")}
      to="/settings/profile"
      linkLabel={t("dashboard.edit", "Edit")}
    >
      <div className="mb-5 flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarImage src={assetUrl(user?.profileImage) ?? undefined} alt="" />
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{user?.name || "—"}</p>
          {user?.username && <p className="truncate text-sm text-muted-foreground">@{user.username}</p>}
        </div>
      </div>

      <dl className="space-y-3.5">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="break-all text-sm text-foreground">
                {value || <span className="text-muted-foreground">{t("dashboard.notProvided", "Not provided")}</span>}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          {t("dashboard.account.roles", "Roles")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {roles.length ? (
            roles.map((role) => (
              <span key={role} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {role}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <KeyRound className="size-3.5" />
          {permissionCount === 1
            ? t("dashboard.account.permission", "1 permission granted")
            : `${permissionCount} ${t("dashboard.account.permissions", "permissions granted")}`}
        </p>
      </div>

      {canChangePassword && (
        <Link
          to="/settings/change-password"
          className="group mt-4 flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-muted/50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Lock className="size-4 text-muted-foreground" />
          <span className="flex-1 font-medium text-foreground">{t("Change password")}</span>
          <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </Panel>
  );
}
