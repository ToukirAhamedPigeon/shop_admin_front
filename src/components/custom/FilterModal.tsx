// src/components/custom/FilterModal.tsx - Enhanced version
'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/hooks/useTranslations'
import { Filter, RotateCcw, X } from 'lucide-react'

interface FilterModalProps<T> {
  tableId: string
  title: string
  open: boolean
  onClose: () => void
  onApply: (filterValues: T) => void
  initialFilters: T
  renderForm: (
    filterValues: T,
    setFilterValues: React.Dispatch<React.SetStateAction<T>>,
    onResetRef?: React.MutableRefObject<(() => void) | null>
  ) => React.ReactNode
}

export function FilterModal<T>({
  tableId,
  title,
  open,
  onClose,
  onApply,
  initialFilters,
  renderForm,
}: FilterModalProps<T>) {
  const {t} = useTranslations()
  const [filterValues, setFilterValues] = useState<T>(initialFilters)
  const resetRef = useRef<(() => void) | null>(null);
  const LOCAL_KEY = `filterModal:${tableId}`

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) {
        try {
          setFilterValues(JSON.parse(saved))
        } catch {
          setFilterValues(initialFilters)
        }
      } else {
        setFilterValues(initialFilters)
      }
    } else {
      setFilterValues(initialFilters)
    }
  }, [open, initialFilters])

  const isFilterApplied = () =>
    JSON.stringify(filterValues) !== JSON.stringify(initialFilters)

  const handleApply = () => {
    onApply(filterValues)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(filterValues))
    onClose()
  }

  const handleReset = () => {
    resetRef.current?.()
    setFilterValues(initialFilters)
    localStorage.removeItem(LOCAL_KEY)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-2xl p-0 shadow-2xl border-0">
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  {t(title)}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {renderForm(filterValues, setFilterValues, resetRef)}
            </div>

            <DialogFooter className="flex flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t('Reset')}
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
              >
                <Filter className="w-4 h-4" />
                {t('Apply Filters')}
              </Button>
              <Button
                variant="destructive"
                onClick={onClose}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                {t('Close')}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}