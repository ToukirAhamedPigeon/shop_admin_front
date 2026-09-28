// src/components/custom/CardView.tsx
// Building blocks for the card views of the settings list pages (Roles, Users,
// Permissions, Options). Each page keeps its table too, behind ViewToggle.
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { ListView } from '@/hooks/useStoredView'

export function ViewToggle({ value, onChange }: { value: ListView; onChange: (v: ListView) => void }) {
  return (
    <div role="radiogroup" aria-label="View" className="flex rounded-lg border border-border bg-muted/50 p-0.5">
      {(
        [
          ['cards', LayoutGrid, 'Cards'],
          ['table', List, 'Table'],
        ] as const
      ).map(([mode, Icon, label]) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
            value === mode ? 'bg-card font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

/** "12 users" / "3 deleted roles", with the view switch on the right. */
export function ListBar({ count, noun, trash, view, onView }: { count: number; noun: string; trash?: boolean; view: ListView; onView: (v: ListView) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {count > 0 && (
          <>
            <span className="font-medium tabular-nums text-foreground">{count.toLocaleString()}</span> {trash ? 'deleted ' : ''}
            {noun}
            {count === 1 ? '' : 's'}
          </>
        )}
      </p>
      <ViewToggle value={view} onChange={onView} />
    </div>
  )
}

export function CardCheckbox({ checked, onToggle, label, disabled }: { checked: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring disabled:hidden',
        !checked && 'sm:opacity-0 sm:group-hover:opacity-100'
      )}
    >
      <span
        className={cn(
          'flex size-4 items-center justify-center rounded border-2 transition-colors',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  )
}

/** Active / Inactive / In trash. */
export function StatusPill({ active, deleted }: { active: boolean; deleted?: boolean }) {
  if (deleted) {
    return <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">In trash</span>
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
      )}
    >
      <span className={cn('size-1.5 rounded-full', active ? 'bg-success' : 'bg-muted-foreground')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">{children}</ul>
}

/** One card: leading visual, title and subtitle (opens detail), checkbox, body, footer with actions. */
export function EntityCard({
  index,
  selected,
  muted,
  leading,
  title,
  subtitle,
  onOpen,
  checkbox,
  children,
  footer,
  actions,
}: {
  index: number
  selected?: boolean
  muted?: boolean
  leading: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  onOpen: () => void
  checkbox?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  actions?: ReactNode
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut', delay: Math.min(index * 0.025, 0.15) }}
      className={cn(
        'group flex min-w-0 flex-col rounded-xl border bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:shadow-sm',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/30',
        muted && 'bg-muted/30'
      )}
    >
      <div className="flex items-start gap-3">
        {leading}
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <p className="truncate text-[15px] font-semibold text-foreground">{title}</p>
          {subtitle && <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>}
        </button>
        {checkbox}
      </div>
      {children && <div className="mt-3 flex-1">{children}</div>}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
        <div className="min-w-0 truncate text-xs text-muted-foreground">{footer}</div>
        {actions}
      </div>
    </motion.li>
  )
}

export function CardGridSkeleton({ avatar = false }: { avatar?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className={cn('size-10 bg-muted', avatar ? 'rounded-full' : 'rounded-lg')} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 flex gap-1.5">
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-5 w-24 rounded-full bg-muted" />
          </div>
          <div className="mt-4 h-3 w-2/5 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

/** Error / empty / skeleton / cards, dimmed while a reload is in flight. */
export function CardsState({
  error,
  empty,
  firstLoad,
  loading,
  errorNode,
  emptyNode,
  skeleton,
  children,
}: {
  error: boolean
  empty: boolean
  firstLoad: boolean
  loading: boolean
  errorNode: ReactNode
  emptyNode: ReactNode
  skeleton: ReactNode
  children: ReactNode
}) {
  if (error) return <div className="rounded-xl border border-border bg-card">{errorNode}</div>
  if (empty) return <div className="rounded-xl border border-border bg-card">{emptyNode}</div>
  if (firstLoad) return <>{skeleton}</>
  return (
    <div className={cn('transition-opacity duration-200', loading && 'opacity-60')} aria-busy={loading}>
      {children}
    </div>
  )
}
