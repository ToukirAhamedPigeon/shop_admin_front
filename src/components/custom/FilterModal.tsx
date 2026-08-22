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
      <DialogContent className="max-w-2xl overflow-hidden rounded-2xl p-0 shadow-xl border-0">
        <div className="relative bg-card border border-border">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Filter className="w-5 h-5 text-primary" />
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {t(title)}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {renderForm(filterValues, setFilterValues, resetRef)}
            </div>

            <DialogFooter className="flex flex-row justify-end gap-3 mt-6 pt-4 border-t border-border">
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
                className="shadow-sm hover:shadow-md transition-shadow gap-2"
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