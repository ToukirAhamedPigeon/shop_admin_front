// src/hooks/useStoredView.ts
import { useCallback, useState } from 'react'

/** The card/table switch used by the settings list pages. */
export type ListView = 'cards' | 'table'
export const LIST_VIEWS = ['cards', 'table'] as const

/**
 * A view choice (e.g. 'cards' | 'table') remembered in localStorage per page.
 * Falls back to the first option when storage is unavailable or holds junk.
 */
export function useStoredView<T extends string>(key: string, options: readonly T[]) {
  const [view, setViewState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key) as T | null
      return saved && options.includes(saved) ? saved : options[0]
    } catch {
      return options[0]
    }
  })

  const setView = useCallback(
    (next: T) => {
      setViewState(next)
      try {
        localStorage.setItem(key, next)
      } catch {
        /* private mode: kept for this visit only */
      }
    },
    [key]
  )

  return [view, setView] as const
}
