// src/modules/settings/translations/components/TranslationDetail.tsx
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCustomDateTime } from '@/lib/formatDate'
import type { ITranslation } from '@/types/translation'
import { Calendar, User, Key, Package, Globe, Clock } from 'lucide-react'

export default function TranslationDetail({ translation }: { translation: ITranslation; onUpdated?: () => void }) {
  const detailRows = [
    { icon: Key, label: 'Key', value: translation.key, color: 'text-blue-500' },
    { icon: Package, label: 'Module', value: translation.module, color: 'text-purple-500' },
    { icon: Globe, label: 'English Value', value: translation.englishValue, color: 'text-emerald-500' },
    { icon: Globe, label: 'Bangla Value', value: translation.banglaValue, color: 'text-emerald-500' },
    { icon: Calendar, label: 'Created At', value: getCustomDateTime(translation.createdAt), color: 'text-gray-500' },
    { icon: Calendar, label: 'Updated At', value: translation.updatedAt ? getCustomDateTime(translation.updatedAt) : '-', color: 'text-gray-500' },
    { icon: User, label: 'Created By', value: (translation as any).createdByName || (translation as any).createdBy || '-', color: 'text-indigo-500' },
    { icon: User, label: 'Updated By', value: (translation as any).updatedByName || (translation as any).updatedBy || '-', color: 'text-indigo-500' },
  ]

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Translation ID</p>
            <p className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200">{translation.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
            <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Module</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {translation.module}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Values Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">English</span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{translation.englishValue}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Bangla</span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{translation.banglaValue}</p>
        </div>
      </div>

      {/* Metadata Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableBody>
            {detailRows.slice(4).map((row) => (
              <TableRow key={row.label} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <TableCell className="font-semibold w-40">
                  <div className="flex items-center gap-2">
                    <row.icon className={`w-4 h-4 ${row.color}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{row.label}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-800 dark:text-gray-200 break-all">
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Timestamps */}
      <div className="flex items-center justify-between pt-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
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