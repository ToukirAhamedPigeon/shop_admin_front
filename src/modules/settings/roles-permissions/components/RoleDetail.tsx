// src/modules/settings/roles-permissions/components/RoleDetail.tsx
import { ShieldCheck } from 'lucide-react'
import { getCustomDateTime } from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import type { IRole } from '@/types/role-permission'
import { groupPermissions, moduleLabel } from './permissionMeta'

export default function RoleDetail({ role }: { role: IRole; onUpdated?: () => void }) {
  const groups = groupPermissions(role.permissions)
  const count = role.permissions?.length ?? 0

  return (
    <div className="space-y-6 py-1">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold capitalize text-foreground [overflow-wrap:anywhere]">{role.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              Guard <span className="font-mono">{role.guardName}</span>
            </span>
            {role.isDeleted ? (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">In trash</span>
            ) : (
              <span className={cn('rounded-full px-2 py-0.5', role.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
                {role.isActive ? 'Active' : 'Inactive'}
              </span>
            )}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {count} permission{count === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">This role has no permissions yet.</p>
        ) : (
          <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {groups.map((g) => (
              <div key={g.module} className="grid gap-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-3">
                <dt className="text-sm font-medium text-foreground">{moduleLabel(g.module)}</dt>
                <dd className="flex flex-wrap gap-1">
                  {g.actions.map((a) => (
                    <span key={a} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground/85">
                      {a}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Created {getCustomDateTime(role.createdAt)}</span>
        {role.updatedAt && <span>Updated {getCustomDateTime(role.updatedAt)}</span>}
      </div>
    </div>
  )
}
