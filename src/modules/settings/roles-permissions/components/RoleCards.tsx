// src/modules/settings/roles-permissions/components/RoleCards.tsx
import { motion } from 'framer-motion'
import { Check, ShieldCheck } from 'lucide-react'
import { RowActions } from '@/components/custom/Table'
import { cn } from '@/lib/utils'
import type { IRole } from '@/types/role-permission'
import { groupPermissions, moduleLabel } from './permissionMeta'

interface RoleCardsProps {
  roles: IRole[]
  selected: Record<string, boolean>
  onToggle: (id: string) => void
  onDetail: (role: IRole) => void
  onEdit?: (role: IRole) => void
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  onPermanentDelete?: (id: string) => void
}

const MAX_GROUPS = 6

export default function RoleCards({ roles, selected, onToggle, onDetail, onEdit, onDelete, onRestore, onPermanentDelete }: RoleCardsProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {roles.map((role, index) => {
        const groups = groupPermissions(role.permissions)
        const count = role.permissions?.length ?? 0
        const isSelected = !!selected[role.id]
        return (
          <motion.li
            key={role.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut', delay: Math.min(index * 0.025, 0.15) }}
            className={cn(
              'group flex min-w-0 flex-col rounded-xl border bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:shadow-sm',
              isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/30',
              role.isDeleted && 'bg-muted/30'
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  role.isDeleted ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                )}
              >
                <ShieldCheck className="size-5" />
              </span>
              <button type="button" onClick={() => onDetail(role)} className="min-w-0 flex-1 cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <p className="truncate text-[15px] font-semibold capitalize text-foreground" title={role.name}>
                  {role.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Guard <span className="font-mono">{role.guardName}</span>
                </p>
              </button>
              <button
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`Select ${role.name}`}
                onClick={() => onToggle(role.id)}
                className={cn(
                  'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring',
                  !isSelected && 'sm:opacity-0 sm:group-hover:opacity-100'
                )}
              >
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded border-2 transition-colors',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
                  )}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {role.isDeleted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">In trash</span>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    role.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', role.isActive ? 'bg-success' : 'bg-muted-foreground')} />
                  {role.isActive ? 'Active' : 'Inactive'}
                </span>
              )}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {count} permission{count === 1 ? '' : 's'}
              </span>
            </div>

            {/* What this role can touch, by module */}
            <div className="mt-3 min-h-[52px] flex-1">
              {groups.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">No permissions assigned yet.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5" aria-label="Permissions by module">
                  {groups.slice(0, MAX_GROUPS).map((g) => (
                    <li
                      key={g.module}
                      title={`${moduleLabel(g.module)}: ${g.actions.join(', ')}`}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground/85"
                    >
                      {moduleLabel(g.module)}
                      <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold tabular-nums text-primary">{g.actions.length}</span>
                    </li>
                  ))}
                  {groups.length > MAX_GROUPS && (
                    <li className="rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground">+{groups.length - MAX_GROUPS} more</li>
                  )}
                </ul>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
              <span className="text-xs text-muted-foreground">
                {groups.length} module{groups.length === 1 ? '' : 's'}
              </span>
              <RowActions
                row={role}
                onDetail={() => onDetail(role)}
                onEdit={onEdit && !role.isDeleted ? () => onEdit(role) : undefined}
                onDelete={onDelete && !role.isDeleted ? () => onDelete(role.id) : undefined}
                onRestore={onRestore && role.isDeleted ? () => onRestore(role.id) : undefined}
                onPermanentDelete={onPermanentDelete && role.isDeleted ? () => onPermanentDelete(role.id) : undefined}
                showEdit={!!onEdit && !role.isDeleted}
                showDelete={!!onDelete && !role.isDeleted}
                showRestore={!!onRestore && role.isDeleted}
                showPermanentDelete={!!onPermanentDelete && role.isDeleted}
                deletePermissions={['delete-admin-roles']}
                restorePermissions={['restore-admin-roles']}
                permanentDeletePermissions={['delete-admin-roles']}
              />
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}

export function RoleCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/4 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 flex gap-1.5">
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-5 w-24 rounded-full bg-muted" />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {[60, 48, 72, 54].map((w, j) => (
              <div key={j} className="h-5 rounded-md bg-muted" style={{ width: w }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
