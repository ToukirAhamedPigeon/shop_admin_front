// src/modules/settings/roles-permissions/components/GroupSelect.tsx
// Pick permission groups for a role or a user. Each group is a card with its
// size and the modules it covers; the permissions it gives then show as
// covered in the PermissionPicker below it.
import { Link } from 'react-router-dom';
import { Check, Layers, Plus, RotateCw } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { usePermissionGroups } from '@/hooks/usePermissionGroups';
import { can } from '@/lib/authCheck';
import { cn } from '@/lib/utils';
import { groupPermissions, moduleLabel } from './permissionMeta';

interface Props {
  id: string;
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}

export default function GroupSelect({ id, label = 'Permission groups', value, onChange, hint }: Props) {
  const { t } = useTranslations();
  const { groups, status, reload } = usePermissionGroups();
  const toggle = (name: string) => onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]);
  // A chosen group that no longer exists still shows, so it can be removed.
  const missing = value.filter((v) => !groups.some((g) => g.name === v));

  return (
    <div className="space-y-2" role="group" aria-labelledby={`${id}-label`}>
      <div className="flex items-baseline justify-between gap-2">
        <p id={`${id}-label`} className="text-sm font-medium text-foreground/80">
          {t(label)}
        </p>
        {value.length > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {value.length} {t('selected')}
          </span>
        )}
      </div>

      {status === 'loading' && groups.length === 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : status === 'error' && groups.length === 0 ? (
        <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-sm text-destructive hover:underline">
          <RotateCw className="size-3.5" />
          {t("Couldn't load groups. Try again")}
        </button>
      ) : groups.length === 0 && missing.length === 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
          <Layers className="size-4" />
          {t('No permission groups yet.')}
          {can(['create-admin-permissions']) && (
            <Link to="/settings/permission-groups" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <Plus className="size-3.5" />
              {t('Create one')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {groups.map((g) => {
            const on = value.includes(g.name);
            const modules = groupPermissions(g.permissions);
            return (
              <button
                key={g.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(g.name)}
                className={cn(
                  'flex min-w-0 items-start gap-3 rounded-lg border p-3 text-left outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  on ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-accent/50',
                  !g.isActive && 'opacity-70'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40 bg-card'
                  )}
                >
                  {on && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{g.name}</span>
                    {!g.isActive && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">{t('Inactive')}</span>
                    )}
                    <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {g.permissions.length} {t(g.permissions.length === 1 ? 'permission' : 'permissions')}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {g.description || modules.slice(0, 3).map((m) => moduleLabel(m.module)).join(' · ') || t('Empty group')}
                  </span>
                </span>
              </button>
            );
          })}
          {missing.map((name) => (
            <button
              key={name}
              type="button"
              role="checkbox"
              aria-checked
              onClick={() => toggle(name)}
              className="flex items-center gap-3 rounded-lg border border-dashed border-destructive/40 p-3 text-left text-sm text-muted-foreground"
            >
              <span className="flex size-4 items-center justify-center rounded border border-primary bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
              <span className="truncate">{name}</span>
              <span className="ml-auto text-[11px]">{t('Not found')}</span>
            </button>
          ))}
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{t(hint)}</p>}
    </div>
  );
}
