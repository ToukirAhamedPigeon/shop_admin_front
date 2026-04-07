import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCustomDateTime } from '@/lib/formatDate'
import type { ITranslation } from '@/types/translation'

export default function TranslationDetail({ translation }: { translation: ITranslation; onUpdated?: () => void }) {
  const rows = [
    ['ID', translation.id],
    ['Key', translation.key],
    ['Module', translation.module],
    ['English Value', translation.englishValue],
    ['Bangla Value', translation.banglaValue],
    ['Created At', getCustomDateTime(translation.createdAt)],
    ['Updated At', translation.updatedAt ? getCustomDateTime(translation.updatedAt) : '-'],
    ['Created By', (translation as any).createdByName || (translation as any).createdBy || '-'],
    ['Updated By', (translation as any).updatedByName || (translation as any).updatedBy || '-'],
  ]

  return (
    <Table>
      <TableBody>
        {rows.map(([label, value]) => (
          <TableRow key={label}>
            <TableCell className="font-semibold w-40">{label}</TableCell>
            <TableCell>{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}