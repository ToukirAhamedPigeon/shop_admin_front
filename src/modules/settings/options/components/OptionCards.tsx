// src/modules/settings/options/components/OptionCards.tsx
import { CornerDownRight, FolderTree, ListTree } from 'lucide-react'
import { RowActions } from '@/components/custom/Table'
import { CardCheckbox, CardGrid, EntityCard, StatusPill } from '@/components/custom/CardView'
import { getCustomDateTime } from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import type { IOption } from '@/types/option'

interface OptionCardsProps {
  options: IOption[]
  selected: Record<string, boolean>
  onToggle: (id: string) => void
  onDetail: (o: IOption) => void
  onEdit?: (o: IOption) => void
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  onPermanentDelete?: (id: string) => void
}

export default function OptionCards({ options, selected, onToggle, onDetail, onEdit, onDelete, onRestore, onPermanentDelete }: OptionCardsProps) {
  return (
    <CardGrid>
      {options.map((opt, index) => {
        const Icon = opt.hasChild ? FolderTree : ListTree
        return (
          <EntityCard
            key={opt.id}
            index={index}
            selected={!!selected[opt.id]}
            muted={opt.isDeleted}
            leading={
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  opt.isDeleted ? 'bg-muted text-muted-foreground' : opt.hasChild ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'
                )}
              >
                <Icon className="size-[18px]" />
              </span>
            }
            title={opt.name}
            subtitle={
              opt.parentName ? (
                <span className="flex items-center gap-1">
                  <CornerDownRight className="size-3 shrink-0" />
                  Under <span className="font-medium text-foreground/80">{opt.parentName}</span>
                </span>
              ) : (
                'Top level'
              )
            }
            onOpen={() => onDetail(opt)}
            checkbox={<CardCheckbox checked={!!selected[opt.id]} onToggle={() => onToggle(opt.id)} label={`Select ${opt.name}`} />}
            footer={
              <span>
                {opt.createdByName ? `${opt.createdByName} · ` : ''}
                {opt.createdAt ? getCustomDateTime(opt.createdAt, 'YYYY-MM-DD') : ''}
              </span>
            }
            actions={
              <RowActions
                row={opt}
                onDetail={() => onDetail(opt)}
                onEdit={onEdit && !opt.isDeleted ? () => onEdit(opt) : undefined}
                onDelete={onDelete && !opt.isDeleted ? () => onDelete(opt.id) : undefined}
                onRestore={onRestore && opt.isDeleted ? () => onRestore(opt.id) : undefined}
                onPermanentDelete={onPermanentDelete && opt.isDeleted ? () => onPermanentDelete(opt.id) : undefined}
                showEdit={!!onEdit && !opt.isDeleted}
                showDelete={!!onDelete && !opt.isDeleted}
                showRestore={!!onRestore && opt.isDeleted}
                showPermanentDelete={!!onPermanentDelete && opt.isDeleted}
                deletePermissions={['delete-admin-options']}
                restorePermissions={['update-admin-options']}
                permanentDeletePermissions={['delete-admin-options']}
              />
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill active={opt.isActive} deleted={opt.isDeleted} />
              {opt.hasChild && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Has sub-options</span>
              )}
            </div>
          </EntityCard>
        )
      })}
    </CardGrid>
  )
}
