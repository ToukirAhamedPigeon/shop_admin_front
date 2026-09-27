// src/modules/dashboard/components/AccountCard.tsx
import { AtSign, KeyRound, Mail, Phone, ShieldCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import type { User } from "@/modules/auth/types";
import Panel from "./Panel";

export default function AccountCard({ user, className }: { user: User | null; className?: string }) {
  const { t } = useTranslations();
  const roles: string[] = user?.roles ?? [];
  const permissionCount = (user?.permissions as string[] | undefined)?.length ?? 0;

  const rows: { icon: LucideIcon; label: string; value?: string }[] = [
    { icon: Mail, label: t("common.email", "Email"), value: user?.email },
    { icon: AtSign, label: t("common.username", "Username"), value: user?.username },
    { icon: Phone, label: t("common.mobileNo", "Mobile"), value: user?.mobileNo },
  ];

  return (
    <Panel
      className={className}
      title={t("dashboard.account.title", "Your account")}
      to="/settings/profile"
      linkLabel={t("dashboard.edit", "Edit")}
    >
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
    </Panel>
  );
}
