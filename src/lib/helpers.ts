import * as XLSX from 'xlsx'
import { formatDateTime } from './formatDate'

export const exportExcel = ({data, fileName, sheetName}: {data: any, fileName: string, sheetName: string}) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `${fileName}.xlsx`)
  }

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const labelFormatter = (input: string): string => {
  if (!input) return input;

  // 1️⃣ Replace underscores and hyphens with space
  let text = input.replace(/[_-]/g, ' ');

  // 2️⃣ Add space before camelCase capitals
  text = text.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

  // 3️⃣ Split words, capitalize, preserve full uppercase acronyms
  const words = text.split(' ').map(word => {
    if (word === word.toUpperCase()) return word; // keep acronyms
    return capitalize(word);
  });

  return words.join(' ');
};
export const twoDigitRandomNumber = Math.floor(Math.random() * 90) + 10;

export const truncateText = (text: string, maxLength: number = 20): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

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

export const formatNumber = (num: number, lang?: string) => {
    if (lang !== "bn") return num.toString()
    const bn = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"]
    return num.toString().replace(/\d/g, d => bn[Number(d)])
}

/**
 * Format file size from bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Also add a function to parse file size from string to bytes (useful for validation)
export const parseFileSize = (size: string): number => {
  const units: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };
  
  const match = size.match(/^([\d.]+)\s*([A-Z]+)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  return value * (units[unit] || 1);
};
