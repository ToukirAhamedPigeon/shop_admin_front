// src/modules/settings/roles-permissions/components/PermissionGroups.tsx
// Permission groups: a card per group (modules it covers, roles and users that
// have it), with add, edit and delete. Groups are live, so the cards say who a
// change will reach.
import { useMemo, useState } from 'react'
import { Layers, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Can } from '@/components/custom/Can'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import { CardGrid, CardGridSkeleton, CardsState, EntityCard, StatusPill } from '@/components/custom/CardView'
import { EmptyState, ErrorState } from '@/components/custom/Table'
import { usePermissionGroups, invalidatePermissionGroups } from '@/hooks/usePermissionGroups'
import { useRefreshAuth } from '@/hooks/useRefreshAuth'
import { useTranslations } from '@/hooks/useTranslations'
import { dispatchShowToast } from '@/lib/dispatch'
import { capitalize } from '@/lib/helpers'
import type { IPermissionGroup } from '@/types/role-permission'
import { deletePermissionGroup } from '../api'
import GroupForm from './GroupForm'
import { groupPermissions, moduleLabel } from './permissionMeta'

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring'

export default function PermissionGroups() {
  const { t } = useTranslations()
  const { refreshUser } = useRefreshAuth()
  const { groups, status, reload } = usePermissionGroups()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<IPermissionGroup | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleting, setDeleting] = useState<IPermissionGroup | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => [g.name, g.description ?? '', ...g.permissions, ...g.roles].some((s) => s.toLowerCase().includes(q)))
  }, [groups, query])

  const open = (group: IPermissionGroup | null) => {
    setEditing(group)
    setSheetOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deletePermissionGroup(deleting.id)
      invalidatePermissionGroups()
      await refreshUser()
      dispatchShowToast({ type: 'success', message: t('Permission group deleted') })
      setDeleting(null)
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } } }
      dispatchShowToast({ type: 'danger', message: e.response?.data?.message || t('Failed to delete the permission group') })
    } finally {
      setDeleteBusy(false)
    }
  }

  const reachOf = (g: IPermissionGroup) => {
    const parts: string[] = []
    if (g.roles.length) parts.push(`${g.roles.length} ${t(g.roles.length === 1 ? 'role' : 'roles')}`)
    if (g.userCount) parts.push(`${g.userCount} ${t(g.userCount === 1 ? 'user' : 'users')}`)
    return parts.join(' · ')
  }

  return (
    <div className="space-y-4">
      {/* Intro + actions */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Layers className="size-5" />
        </span>
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-sm font-medium text-foreground">{t('Give many permissions at once')}</p>
          <p className="text-xs text-muted-foreground">
            {t('Give a group to a role or a user. Changing a group changes everyone who has it.')}
          </p>
        </div>
        <Can anyOf={['create-admin-permissions']}>
          <Button onClick={() => open(null)}>
            <Plus className="size-4" />
            {t('New group')}
          </Button>
        </Can>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search groups, permissions or roles…')}
            aria-label={t('Search groups')}
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          {query && (
            <button type="button" aria-label={t('Clear search')} onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{visible.length}</span> {t(visible.length === 1 ? 'group' : 'groups')}
        </p>
      </div>

      <CardsState
        error={status === 'error' && groups.length === 0}
        empty={status === 'ready' && visible.length === 0}
        firstLoad={status === 'loading' && groups.length === 0}
        loading={status === 'loading'}
        errorNode={<ErrorState message={t("Couldn't load permission groups")} onRetry={reload} />}
        emptyNode={<EmptyState message={query ? t('No groups match your search') : t('No permission groups yet')} suggestion={query ? undefined : t('Create one to give several permissions at once.')} />}
        skeleton={<CardGridSkeleton />}
      >
        <CardGrid>
          {visible.map((g, i) => {
            const modules = groupPermissions(g.permissions)
            return (
              <EntityCard
                key={g.id}
                index={i}
                muted={!g.isActive}
                leading={
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Layers className="size-5" />
                  </span>
                }
                title={g.name}
                subtitle={g.description || `${g.permissions.length} ${t(g.permissions.length === 1 ? 'permission' : 'permissions')}`}
                onOpen={() => open(g)}
                footer={
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {reachOf(g) || t('Not given to anyone yet')}
                  </span>
                }
                actions={
                  <div className="-mr-1.5 flex items-center">
                    <Can anyOf={['update-admin-permissions']}>
                      <button type="button" onClick={() => open(g)} aria-label={`${t('Edit')} ${g.name}`} title={t('Edit')} className={`${iconButton} hover:bg-accent hover:text-foreground`}>
                        <Pencil className="size-4" />
                      </button>
                    </Can>
                    <Can anyOf={['delete-admin-permissions']}>
                      <button type="button" onClick={() => setDeleting(g)} aria-label={`${t('Delete')} ${g.name}`} title={t('Delete')} className={`${iconButton} hover:bg-destructive/10 hover:text-destructive`}>
                        <Trash2 className="size-4" />
                      </button>
                    </Can>
                  </div>
                }
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusPill active={g.isActive} />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {g.permissions.length} {t(g.permissions.length === 1 ? 'permission' : 'permissions')}
                  </span>
                </div>
                {modules.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t('Permissions by module')}>
                    {modules.slice(0, 6).map((m) => (
                      <li
                        key={m.module}
                        title={`${moduleLabel(m.module)}: ${m.actions.join(', ')}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[11px] text-foreground/85"
                      >
                        {moduleLabel(m.module)}
                        <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold tabular-nums text-primary">{m.actions.length}</span>
                      </li>
                    ))}
                    {modules.length > 6 && <li className="px-1 text-[11px] text-muted-foreground">+{modules.length - 6}</li>}
                  </ul>
                )}
                {g.roles.length > 0 && (
                  <p className="mt-3 truncate text-xs text-muted-foreground">
                    {t('Roles')}: {g.roles.map(capitalize).join(', ')}
                  </p>
                )}
              </EntityCard>
            )
          })}
        </CardGrid>
      </CardsState>

      <FormHolderSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? 'Edit Permission Group' : 'New Permission Group'}
        description={editing ? editing.name : 'Bundle permissions to give them together.'}
        icon={Layers}
        titleDivClassName={editing ? 'warning-gradient' : 'success-gradient'}
      >
        {sheetOpen && <GroupForm key={editing?.id ?? 'new'} group={editing} onClose={() => setSheetOpen(false)} onSaved={() => undefined} />}
      </FormHolderSheet>

      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t('Delete permission group')}
        variant="destructive"
        confirmLabel={deleteBusy ? t('Deleting…') : t('Delete')}
        loading={deleteBusy}
      >
        <p>
          {t('Delete')} <span className="font-medium text-foreground">{deleting?.name}</span>?{' '}
          {deleting && reachOf(deleting)
            ? `${t('Roles and users that have it lose its permissions')} (${reachOf(deleting)}).`
            : t("It isn't given to anyone.")}
        </p>
      </ConfirmDialog>
    </div>
  )
}
