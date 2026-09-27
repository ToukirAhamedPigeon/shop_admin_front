// src/modules/settings/translations/components/TranslationDetail.tsx
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCustomDateTime } from '@/lib/formatDate'
import type { ITranslation } from '@/types/translation'
import { Calendar, User, Key, Package, Globe, Clock } from 'lucide-react'

export default function TranslationDetail({ translation }: { translation: ITranslation; onUpdated?: () => void }) {
  const detailRows = [
    { icon: Key, label: 'Key', value: translation.key },
    { icon: Package, label: 'Module', value: translation.module },
    { icon: Globe, label: 'English Value', value: translation.englishValue },
    { icon: Globe, label: 'Bangla Value', value: translation.banglaValue },
    { icon: Calendar, label: 'Created At', value: getCustomDateTime(translation.createdAt) },
    { icon: Calendar, label: 'Updated At', value: translation.updatedAt ? getCustomDateTime(translation.updatedAt) : '-' },
    { icon: User, label: 'Created By', value: (translation as any).createdByName || (translation as any).createdBy || '-' },
    { icon: User, label: 'Updated By', value: (translation as any).updatedByName || (translation as any).updatedBy || '-' },
  ]

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <Key className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Translation ID</p>
            <p className="text-sm font-mono font-semibold text-foreground">{translation.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Module</p>
            <p className="text-sm font-semibold text-foreground">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {translation.module}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Values Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-muted border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">English</span>
          </div>
          <p className="text-sm text-foreground break-words">{translation.englishValue}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bangla</span>
          </div>
          <p className="text-sm text-foreground break-words">{translation.banglaValue}</p>
        </div>
      </div>

      {/* Metadata Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableBody>
            {detailRows.slice(4).map((row) => (
              <TableRow key={row.label} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-semibold w-28 sm:w-40 align-top whitespace-normal">
                  <div className="flex items-center gap-2">
                    <row.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{row.label}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-foreground whitespace-normal [overflow-wrap:anywhere]">
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Timestamps */}
      <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Created: {getCustomDateTime(translation.createdAt, 'YYYY-MM-DD HH:mm:ss')}</span>
        </div>
        {translation.updatedAt && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Last Updated: {getCustomDateTime(translation.updatedAt, 'YYYY-MM-DD HH:mm:ss')}</span>
          </div>
        )}
      </div>
    </div>
  )
}