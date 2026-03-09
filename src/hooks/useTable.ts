import { useState, useCallback, useEffect } from 'react'
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
  const [pendingPage, setPendingPage] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (targetPage?: number) => {
    setLoading(true)
    setError(null)
    
    const sortBy = sorting.length ? sorting[0].id : defaultSort
    const sortOrder = sorting.length && !sorting[0].desc ? 'asc' : 'desc'
    
    // Use target page if provided, otherwise use current pageIndex
    const pageToFetch = targetPage !== undefined ? targetPage + 1 : pageIndex + 1

    try {
      const res = await fetcher({
        q: globalFilter,
        page: pageToFetch,
        limit: pageSize,
        sortBy,
        sortOrder,
      })
      
      setData(res.data)
      setTotalCount(res.total)
      setGrandTotalCount(res.grandTotalCount)
      
      // Update page index after successful fetch if target page was provided
      if (targetPage !== undefined) {
        setPageIndex(targetPage)
        setPendingPage(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [fetcher, globalFilter, pageIndex, pageSize, sorting, defaultSort])

  // Handle pending page changes
  useEffect(() => {
    if (pendingPage !== null && pendingPage !== pageIndex) {
      fetchData(pendingPage)
    }
  }, [pendingPage, pageIndex, fetchData])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchData()
  }, [globalFilter, pageSize, sorting, defaultSort]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = useCallback((newPage: number) => {
    setPendingPage(newPage)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPageIndex(0) // Reset to first page when changing page size
    setPendingPage(0)
  }, [])

  return {
    data,
    loading,
    error,
    totalCount,
    grandTotalCount,
    pageIndex,
    pageSize,
    globalFilter,
    sorting,
    setPageIndex: handlePageChange,
    setPageSize: handlePageSizeChange,
    setGlobalFilter,
    setSorting: setSorting as OnChangeFn<SortingState>,
    fetchData: () => fetchData(),
    refresh: () => fetchData(pageIndex),
  }
}