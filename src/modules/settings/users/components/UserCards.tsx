// src/modules/settings/users/components/UserCards.tsx
import { useState } from 'react'
import { BadgeCheck, Mail, Phone, ShieldAlert } from 'lucide-react'
import { RowActions } from '@/components/custom/Table'
import { CardCheckbox, CardGrid, EntityCard, StatusPill } from '@/components/custom/CardView'
import type { IUser } from '@/types'

const isDeveloper = (user: IUser) =>
  !!user.roles?.includes('developer') ||
  !!(user as IUser & { roleNames?: string }).roleNames?.split(',').map((r) => r.trim()).includes('developer')

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'

function Avatar({ user }: { user: IUser }) {
  const [failed, setFailed] = useState(false)
  if (user.profileImage && !failed) {
    return (
      <img
        src={import.meta.env.VITE_API_ASSET_URL + user.profileImage}
        alt=""
        onError={() => setFailed(true)}
        className="size-11 shrink-0 rounded-full object-cover ring-2 ring-card"
      />
    )
  }
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials(user.name)}
    </span>
  )
}

interface UserCardsProps {
  users: IUser[]
  selected: Record<string, boolean>
  onToggle: (id: string) => void
  onDetail: (u: IUser) => void
  onEdit?: (u: IUser) => void
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  onPermanentDelete?: (id: string) => void
}

export default function UserCards({ users, selected, onToggle, onDetail, onEdit, onDelete, onRestore, onPermanentDelete }: UserCardsProps) {
  return (
    <CardGrid>
      {users.map((user, index) => {
        const dev = isDeveloper(user)
        const verified = !!(user as IUser & { emailVerifiedAt?: string | null }).emailVerifiedAt
        return (
          <EntityCard
            key={user.id}
            index={index}
            selected={!!selected[user.id]}
            muted={user.isDeleted}
            leading={<Avatar user={user} />}
            title={user.name}
            subtitle={<span className="font-mono">@{user.username}</span>}
            onOpen={() => onDetail(user)}
            checkbox={
              <CardCheckbox
                checked={!!selected[user.id]}
                onToggle={() => onToggle(user.id)}
                label={`Select ${user.name}`}
                disabled={dev}
              />
            }
            footer={
              dev ? (
                <span className="inline-flex items-center gap-1 text-warning">
                  <ShieldAlert className="size-3.5" /> Protected account
                </span>
              ) : (
                <span>{user.roles?.length ? `${user.roles.length} role${user.roles.length > 1 ? 's' : ''}` : 'No role'}</span>
              )
            }
            actions={
              <RowActions
                row={user}
                onDetail={() => onDetail(user)}
                onEdit={onEdit && !user.isDeleted ? () => onEdit(user) : undefined}
                onDelete={onDelete && !user.isDeleted && !dev ? () => onDelete(user.id) : undefined}
                onRestore={onRestore && user.isDeleted ? () => onRestore(user.id) : undefined}
                onPermanentDelete={onPermanentDelete && user.isDeleted ? () => onPermanentDelete(user.id) : undefined}
                showEdit={!!onEdit && !user.isDeleted}
                showDelete={!!onDelete && !user.isDeleted && !dev}
                showRestore={!!onRestore && user.isDeleted}
                showPermanentDelete={!!onPermanentDelete && user.isDeleted}
                deletePermissions={['delete-admin-users']}
                restorePermissions={['restore-admin-users']}
                permanentDeletePermissions={['delete-admin-users']}
              />
            }
          >
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="flex min-w-0 items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate" title={user.email}>
                  {user.email}
                </span>
                {verified && <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Email verified" />}
              </p>
              {user.mobileNo && (
                <p className="flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" />
                  <span className="truncate">{user.mobileNo}</span>
                </p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StatusPill active={user.isActive} deleted={user.isDeleted} />
              {(user.roles ?? []).slice(0, 3).map((r) => (
                <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium capitalize text-primary">
                  {r}
                </span>
              ))}
              {(user.roles?.length ?? 0) > 3 && <span className="text-[11px] text-muted-foreground">+{user.roles!.length - 3}</span>}
            </div>
          </EntityCard>
        )
      })}
    </CardGrid>
  )
}
