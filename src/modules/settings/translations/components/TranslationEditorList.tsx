// src/modules/settings/translations/components/TranslationEditorList.tsx
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, Loader2, Pencil } from 'lucide-react'
import { RowActions } from '@/components/custom/Table'
import { cn } from '@/lib/utils'
import type { ITranslation } from '@/types/translation'

type Field = 'englishValue' | 'banglaValue'

interface TranslationEditorListProps {
  rows: ITranslation[]
  canEdit: boolean
  canDelete: boolean
  selected: Record<string, boolean>
  onToggle: (id: string) => void
  onSave: (row: ITranslation, field: Field, value: string) => Promise<void>
  onDetail: (row: ITranslation) => void
  onEdit: (row: ITranslation) => void
  onDelete: (id: string) => void
}

const Checkbox = ({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span
      className={cn(
        'flex size-4 items-center justify-center rounded border-2 transition-colors',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary/60'
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  </button>
)

/** A value that turns into a text box when clicked. Enter saves, Shift+Enter adds a line, Esc cancels. */
function InlineValue({
  row,
  field,
  lang,
  langLabel,
  canEdit,
  onSave,
}: {
  row: ITranslation
  field: Field
  lang: 'en' | 'bn'
  langLabel: string
  canEdit: boolean
  onSave: (row: ITranslation, field: Field, value: string) => Promise<void>
}) {
  const value = row[field] ?? ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  // Grow the box with its text.
  useEffect(() => {
    const el = ref.current
    if (!editing || !el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft, editing])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 1400)
    return () => clearTimeout(t)
  }, [saved])

  const start = () => {
    if (!canEdit) return
    setDraft(value)
    setEditing(true)
  }

  const commit = async () => {
    const next = draft.trim()
    if (next === value.trim()) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(row, field, next)
      setEditing(false)
      setSaved(true)
    } catch {
      // The toast explains; keep the box open so nothing typed is lost.
      ref.current?.focus()
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="relative">
        <textarea
          ref={ref}
          value={draft}
          lang={lang}
          rows={1}
          autoFocus
          onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          aria-label={`${langLabel} for ${row.key}`}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (!saving) commit()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              setDraft(value)
              setEditing(false)
            }
          }}
          className="block w-full resize-none overflow-hidden rounded-lg border border-primary bg-background px-2.5 py-1.5 text-sm leading-relaxed text-foreground outline-none ring-[3px] ring-ring/30 disabled:opacity-70"
        />
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {saving ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Saving…
            </>
          ) : (
            <>Enter to save · Esc to cancel</>
          )}
        </p>
      </div>
    )
  }

  const missing = !value.trim()
  return (
    <button
      type="button"
      onClick={start}
      disabled={!canEdit}
      lang={lang}
      aria-label={`${langLabel} for ${row.key}: ${value.trim() || 'missing'}${canEdit ? '. Click to edit' : ''}`}
      title={canEdit ? `Edit ${langLabel}` : undefined}
      className={cn(
        'group/value relative block w-full rounded-lg px-2.5 py-1.5 text-left text-sm leading-relaxed outline-none transition-colors [overflow-wrap:anywhere]',
        canEdit && 'cursor-text hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
        !canEdit && 'cursor-default',
        saved && 'bg-success/10'
      )}
    >
      {missing ? (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning">
          <AlertCircle className="size-3.5" />
          Missing
        </span>
      ) : (
        <span className="line-clamp-3 text-foreground/90">{value}</span>
      )}
      {canEdit && !saved && (
        <Pencil className="absolute right-2 top-2 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/value:opacity-100 group-focus-visible/value:opacity-100" />
      )}
      {saved && <Check className="absolute right-2 top-2 size-3.5 text-success" />}
    </button>
  )
}

/** Key and module on the left, English and Bangla side by side, each editable in place. */
export default function TranslationEditorList({
  rows,
  canEdit,
  canDelete,
  selected,
  onToggle,
  onSave,
  onDetail,
  onEdit,
  onDelete,
}: TranslationEditorListProps) {
  return (
    <div>
      <div className="hidden grid-cols-[28px_minmax(0,15rem)_minmax(0,1fr)_minmax(0,1fr)_104px] items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground lg:grid">
        <span />
        <span>Key</span>
        <span className="flex items-center gap-1.5">
          <span className="rounded bg-card px-1 font-mono text-[10px] font-semibold text-foreground/70 ring-1 ring-border">EN</span>
          English
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded bg-card px-1 font-mono text-[10px] font-semibold text-foreground/70 ring-1 ring-border">BN</span>
          বাংলা
        </span>
        <span className="sr-only">Actions</span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const isSelected = !!selected[row.id]
          return (
            <li
              key={row.id}
              className={cn(
                'grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 px-3 py-2.5 transition-colors lg:grid-cols-[28px_minmax(0,15rem)_minmax(0,1fr)_minmax(0,1fr)_104px]',
                isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
              )}
            >
              <div className="pt-1">
                <Checkbox checked={isSelected} onToggle={() => onToggle(row.id)} label={`Select ${row.key}`} />
              </div>
              <div className="min-w-0 pt-1.5">
                <p className="font-mono text-[13px] font-medium text-foreground [overflow-wrap:anywhere]">{row.key}</p>
                <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{row.module}</span>
              </div>
              {/* Phones and tablets: actions sit beside the key; the values span below. */}
              <div className="pt-0.5 lg:order-last">
                <RowActions
                  row={row}
                  onDetail={() => onDetail(row)}
                  onEdit={() => onEdit(row)}
                  onDelete={() => onDelete(row.id)}
                  showEdit={canEdit}
                  showDelete={canDelete}
                  deletePermissions={['delete-admin-translations']}
                />
              </div>
              <div className="col-span-3 col-start-1 grid gap-1 sm:grid-cols-2 lg:col-span-2 lg:col-start-3 lg:grid-cols-2 lg:gap-3">
                <div className="min-w-0">
                  <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">English</p>
                  <InlineValue row={row} field="englishValue" lang="en" langLabel="English" canEdit={canEdit} onSave={onSave} />
                </div>
                <div className="min-w-0">
                  <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">বাংলা</p>
                  <InlineValue row={row} field="banglaValue" lang="bn" langLabel="Bangla" canEdit={canEdit} onSave={onSave} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
