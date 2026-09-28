// src/modules/settings/roles-permissions/components/PermissionPicker.tsx
// Every permission, grouped by module ("read-admin-users" → Users: read),
// with a checkbox per module and a chip per action. Used by the Role form and
// by a user's extra permissions.
import { useMemo, useState } from 'react';
import { Check, Layers, Minus, RotateCw, Search, X } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useOptionNames } from '@/hooks/useOptionNames';
import { cn } from '@/lib/utils';
import { moduleLabel, parsePermission } from './permissionMeta';

interface Props {
  id: string;
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  hint?: string;
  /**
   * Permissions already given some other way (by permission groups), keyed by
   * name → where they come from. Shown as covered and can't be toggled here.
   */
  inherited?: Record<string, string[]>;
}

const NO_INHERITED: Record<string, string[]> = {};

type Group = { module: string; items: { name: string; action: string }[] };

function groupNames(names: string[]): Group[] {
  const map = new Map<string, Group>();
  for (const name of names) {
    const { action, module } = parsePermission(name);
    const g = map.get(module) ?? { module, items: [] };
    g.items.push({ name, action });
    map.set(module, g);
  }
  return [...map.values()]
    .map((g) => ({ ...g, items: g.items.sort((a, b) => a.action.localeCompare(b.action)) }))
    .sort((a, b) => a.module.localeCompare(b.module));
}

function ModuleCheck({ state, onClick, label }: { state: 'all' | 'some' | 'none'; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === 'all' ? true : state === 'some' ? 'mixed' : false}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded border outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
        state === 'none' ? 'border-muted-foreground/40 bg-card' : 'border-primary bg-primary text-primary-foreground'
      )}
    >
      {state === 'all' && <Check className="size-3" />}
      {state === 'some' && <Minus className="size-3" />}
    </button>
  );
}

export default function PermissionPicker({ id, label = 'Permissions', value, onChange, error, hint, inherited = NO_INHERITED }: Props) {
  const { t } = useTranslations();
  const { names, status, reload } = useOptionNames('/Options/permissions');
  const [query, setQuery] = useState('');

  const selected = useMemo(() => new Set(value), [value]);
  // Selected names the list doesn't know still show, so they can be removed.
  const groups = useMemo(() => groupNames([...new Set([...names, ...value, ...Object.keys(inherited)])]), [names, value, inherited]);
  const isInherited = (name: string) => !!inherited[name]?.length;
  const inheritedCount = Object.keys(inherited).length;
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      q
        ? groups
            .map((g) => ({ ...g, items: moduleLabel(g.module).toLowerCase().includes(q) ? g.items : g.items.filter((i) => i.name.toLowerCase().includes(q)) }))
            .filter((g) => g.items.length > 0)
        : groups,
    [groups, q]
  );

  const set = (next: Set<string>) => onChange([...next]);
  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    set(next);
  };
  const toggleGroup = (g: Group) => {
    const next = new Set(selected);
    const own = g.items.filter((i) => !isInherited(i.name));
    const all = own.every((i) => next.has(i.name));
    own.forEach((i) => (all ? next.delete(i.name) : next.add(i.name)));
    set(next);
  };

  return (
    <div className="space-y-2" role="group" aria-labelledby={`${id}-label`}>
      <div className="flex flex-wrap items-center gap-2">
        <p id={`${id}-label`} className="mr-auto text-sm font-medium text-foreground/80">
          {t(label)}
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {value.length}/{groups.reduce((n, g) => n + g.items.length, 0)}
          </span>
          {inheritedCount > 0 && (
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              <Layers className="size-3" />
              {inheritedCount} {t('from groups')}
            </span>
          )}
        </p>
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            {t('Clear all')}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="relative border-b border-border bg-muted/40">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={id}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Filter by module or name…')}
            className="h-10 w-full bg-transparent pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          {query && (
            <button type="button" aria-label={t('Clear filter')} onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-[26rem] divide-y divide-border overflow-y-auto">
          {status === 'loading' && groups.length === 0 &&
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-3 py-3" aria-hidden>
                <span className="size-4 rounded bg-muted" />
                <span className="h-3.5 w-24 rounded bg-muted" />
                <span className="ml-auto h-6 w-40 rounded-full bg-muted" />
              </div>
            ))}
          {status === 'error' && groups.length === 0 && (
            <button type="button" onClick={reload} className="flex w-full items-center justify-center gap-1.5 py-6 text-sm text-destructive hover:underline">
              <RotateCw className="size-3.5" />
              {t("Couldn't load permissions. Try again")}
            </button>
          )}
          {status !== 'loading' && visible.length === 0 && groups.length > 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('No permissions match.')}</p>
          )}

          {visible.map((g) => {
            const count = g.items.filter((i) => selected.has(i.name) || isInherited(i.name)).length;
            const state = count === 0 ? 'none' : count === g.items.length ? 'all' : 'some';
            return (
              <div key={g.module} className={cn('flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center', count > 0 && 'bg-primary/[0.03]')}>
                <div className="flex min-w-0 items-center gap-2.5 sm:w-44 sm:shrink-0">
                  <ModuleCheck state={state} onClick={() => toggleGroup(g)} label={`${t('All')} ${moduleLabel(g.module)}`} />
                  <span className="truncate text-sm font-medium text-foreground" title={moduleLabel(g.module)}>
                    {moduleLabel(g.module)}
                  </span>
                  <span className="ml-auto text-[11px] tabular-nums text-muted-foreground sm:ml-0">
                    {count}/{g.items.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-6 sm:pl-0">
                  {g.items.map((item) => {
                    const via = inherited[item.name];
                    if (via?.length) {
                      return (
                        <span
                          key={item.name}
                          title={`${item.name} · ${t('from')} ${via.join(', ')}`}
                          className="inline-flex h-7 cursor-default items-center gap-1 rounded-full border border-dashed border-success/50 bg-success/10 px-2.5 text-xs font-medium text-success"
                        >
                          <Layers className="size-3" />
                          {item.action}
                          <span className="sr-only">
                            ({t('from')} {via.join(', ')})
                          </span>
                        </span>
                      );
                    }
                    const on = selected.has(item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        aria-pressed={on}
                        title={item.name}
                        onClick={() => toggle(item.name)}
                        className={cn(
                          'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50',
                          on ? 'border-primary/50 bg-primary/10 font-medium text-primary' : 'border-border text-foreground/75 hover:bg-accent'
                        )}
                      >
                        {on && <Check className="size-3" />}
                        {item.action}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hint && !error && <p className="text-xs text-muted-foreground">{t(hint)}</p>}
      {error && <p className="text-sm text-destructive">{t(error)}</p>}
    </div>
  );
}
