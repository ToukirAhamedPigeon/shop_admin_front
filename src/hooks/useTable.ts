import { useState, useCallback } from 'react'
import type { ColumnDef, SortingState, OnChangeFn } from '@tanstack/react-table'

export function useTable<T>({
  fetcher,
  initialColumns = [],
  defaultSort = 'createdAt',
}: {
  fetcher: (params: {
    q: string
    page: number
    limit: number
    sortBy: string
    sortOrder: string
  }) => Promise<{ data: T[]; total: number; grandTotalCount: number }>
  initialColumns?: ColumnDef<T, any>[]
  defaultSort?: string
}) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [grandTotalCount, setGrandTotalCount] = useState(0)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const sortBy = sorting.length ? sorting[0].id : defaultSort
    const sortOrder = sorting.length && !sorting[0].desc ? 'asc' : 'desc'

    try {
      const res = await fetcher({
        q: globalFilter,
        page: pageIndex + 1,
        limit: pageSize,
        sortBy,
        sortOrder,
      })
      setData(res.data)
      setTotalCount(res.total)
      setGrandTotalCount(res.grandTotalCount)
    } finally {
      setLoading(false)
    }
  }, [fetcher, globalFilter, pageIndex, pageSize, sorting, defaultSort])

  return {
    data,
    loading,
    totalCount,
    grandTotalCount,
    pageIndex,
    pageSize,
    globalFilter,
    sorting,
    setPageIndex,
    setPageSize,
    setGlobalFilter,
    setSorting: setSorting as OnChangeFn<SortingState>,
    fetchData,
  }
}
