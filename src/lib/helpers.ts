import * as XLSX from 'xlsx'
import { formatDateTime } from './formatDate'

export const exportExcel = ({data, fileName, sheetName}: {data: any, fileName: string, sheetName: string}) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `${fileName}.xlsx`)
  }

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const twoDigitRandomNumber = Math.floor(Math.random() * 90) + 10;

 export function omitFields<T extends Record<string, any>>(obj: T, fields: string[]): Partial<T> {
    const result = { ...obj }
    for (const field of fields) {
      delete result[field]
    }
    return result
  }

  export function formatKeyLabel(key: string): string {
    // Remove leading underscores
    const cleanKey = key.replace(/^_+/, '')
  
    // Convert camelCase or PascalCase to "Title Case with Spaces"
    const spaced = cleanKey.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  
    // Capitalize first letter
    return spaced.charAt(0).toUpperCase() + spaced.slice(1)
  }

  export function formatObjValue(value: any, key?: string): string {
    if (value === undefined || value === null) return "—"
    if ((key === 'createdAt' || key === 'updatedAt') && (typeof value === 'string' || value instanceof Date)) {
        const dateStr = value instanceof Date ? value.toISOString() : String(value)
        return formatDateTime(dateStr)
    }
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  type CaseStyle = 'title' | 'lower' | 'upper' | 'sentence'

/**
 * Formats camelCase, kebab-case, or snake_case into readable text.
 * Supports 'title', 'lower', 'upper', and 'sentence' casing.
 */
export function formatLabel(input: string, style: CaseStyle = 'title'): string {
  const normalized = input
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
    .replace(/[_-]/g, ' ')               // snake_case/kebab-case → space
    .replace(/\s+/g, ' ')                // collapse spaces
    .trim()

  const words = normalized.split(' ').map(w => w.toLowerCase())

  switch (style) {
    case 'title':
      return words.map(capitalize).join(' ')
    case 'lower':
      return words.join(' ')
    case 'upper':
      return words.join(' ').toUpperCase()
    case 'sentence':
      return [capitalize(words[0]), ...words.slice(1)].join(' ')
    default:
      return normalized
  }

  function capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1)
  }
}


export function parseChanges(changes?: string): Record<string, any> | undefined {
  if (!changes) return undefined;
  try {
    return JSON.parse(changes);
  } catch {
    return { raw: changes }; // fallback
  }
}
