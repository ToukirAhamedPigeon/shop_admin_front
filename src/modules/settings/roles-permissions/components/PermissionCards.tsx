// src/modules/settings/roles-permissions/components/PermissionCards.tsx
import { KeyRound } from 'lucide-react'
import { RowActions } from '@/components/custom/Table'
import { CardCheckbox, CardGrid, EntityCard, StatusPill } from '@/components/custom/CardView'
import { cn } from '@/lib/utils'
import type { IPermission } from '@/types/role-permission'
import { moduleLabel, parsePermission } from './permissionMeta'

// Colour by what the permission lets you do.
const ACTION_TONE: Record<string, string> = {
  read: 'bg-info/10 text-info',
  create: 'bg-success/10 text-success',
  update: 'bg-warning/10 text-warning',
  delete: 'bg-destructive/10 text-destructive',
  restore: 'bg-warning/10 text-warning',
}

interface PermissionCardsProps {
  permissions: IPermission[]
  selected: Record<string, boolean>
  onToggle: (id: string) => void
  onDetail: (p: IPermission) => void
  onEdit?: (p: IPermission) => void
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  onPermanentDelete?: (id: string) => void
}

export default function PermissionCards({ permissions, selected, onToggle, onDetail, onEdit, onDelete, onRestore, onPermanentDelete }: PermissionCardsProps) {
  return (
    <CardGrid>
      {permissions.map((perm, index) => {
        const { action, module } = parsePermission(perm.name)
        const tone = ACTION_TONE[action] ?? 'bg-primary/10 text-primary'
        const roles = perm.roles ?? []
        return (
          <EntityCard
            key={perm.id}
            index={index}
            selected={!!selected[perm.id]}
            muted={perm.isDeleted}
            leading={
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', perm.isDeleted ? 'bg-muted text-muted-foreground' : tone)}>
                <KeyRound className="size-[18px]" />
              </span>
            }
            title={<span className="font-mono text-sm">{perm.name}</span>}
            subtitle={
              <span className="flex items-center gap-1.5">
                <span className={cn('rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide', tone)}>{action}</span>
                {moduleLabel(module)}
              </span>
            }
            onOpen={() => onDetail(perm)}
            checkbox={<CardCheckbox checked={!!selected[perm.id]} onToggle={() => onToggle(perm.id)} label={`Select ${perm.name}`} />}
            footer={
              <span>
                Guard <span className="font-mono">{perm.guardName}</span>
              </span>
            }
            actions={
              <RowActions
                row={perm}
                onDetail={() => onDetail(perm)}
                onEdit={onEdit && !perm.isDeleted ? () => onEdit(perm) : undefined}
                onDelete={onDelete && !perm.isDeleted ? () => onDelete(perm.id) : undefined}
                onRestore={onRestore && perm.isDeleted ? () => onRestore(perm.id) : undefined}
                onPermanentDelete={onPermanentDelete && perm.isDeleted ? () => onPermanentDelete(perm.id) : undefined}
                showEdit={!!onEdit && !perm.isDeleted}
                showDelete={!!onDelete && !perm.isDeleted}
                showRestore={!!onRestore && perm.isDeleted}
                showPermanentDelete={!!onPermanentDelete && perm.isDeleted}
                deletePermissions={['delete-admin-permissions']}
                restorePermissions={['restore-admin-permissions']}
                permanentDeletePermissions={['delete-admin-permissions']}
              />
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill active={perm.isActive} deleted={perm.isDeleted} />
              {roles.length === 0 ? (
                <span className="text-[11px] italic text-muted-foreground">Not given to any role</span>
              ) : (
                <>
                  {roles.slice(0, 4).map((r) => (
                    <span key={r} className="rounded-full border border-border px-2 py-0.5 text-[11px] capitalize text-foreground/85">
                      {r}
                    </span>
                  ))}
                  {roles.length > 4 && <span className="text-[11px] text-muted-foreground">+{roles.length - 4}</span>}
                </>
              )}
            </div>
          </EntityCard>
        )
      })}
    </CardGrid>
  )
}
