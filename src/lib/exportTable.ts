import * as XLSX from 'xlsx'
import type { ColumnDef } from '@tanstack/react-table'

export interface ExportOptions<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  visibleColumnIds: string[]
  fileName?: string // base name only, no extension or timestamp
  sheetName?: string
}

function getTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  )
}

export function exportVisibleTableToExcel<T>({
  data,
  columns,
  visibleColumnIds,
  fileName = 'ExportedData',
  sheetName = 'Sheet1',
}: ExportOptions<T>) {
  const timestamp = getTimestamp()
  const finalFileName = `${fileName}_${timestamp}.xlsx`

  const visibleColumns = columns.filter((col) => {
    const colId =
      col.id ??
      (typeof (col as any).accessorKey === 'string'
        ? (col as any).accessorKey
        : undefined)
    return colId && visibleColumnIds.includes(colId)
  })

  const headers = visibleColumns.map((col) => String(col.header ?? ''))

  const rows = data.map((row) => {
    return visibleColumns.map((col) => {
      const colId =
        col.id ??
        (typeof (col as any).accessorKey === 'string'
          ? (col as any).accessorKey
          : undefined)

      if (!colId) return ''

      // ✅ Handle image column as HYPERLINK formula
      if (colId === 'profile_picture' || colId === 'image') {
        const imageUrl = (row as any)['image'] || '/policeman.png'
        return {
          f: `HYPERLINK("${imageUrl}", "View Image")`,
        }
      }

      const accessorKey = (col as any).accessorKey
      const value = accessorKey ? (row as any)[accessorKey] : ''

      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value)
      }

      return value
    })
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, finalFileName)
}
