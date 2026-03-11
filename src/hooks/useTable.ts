import { useState, useCallback, useEffect } from 'react'
import type { ColumnDef, SortingState, OnChangeFn } from '@tanstack/react-table'

// Define the view indicator type
type ViewIndicatorType = 'trash' | 'store'

interface ViewIndicatorConfig {
  show: boolean
  type: ViewIndicatorType
  message: string
  iconType: ViewIndicatorType
  bgColor: string
  borderColor: string
  textColor: string
}

export function useTable<T>({
  fetcher,
  initialColumns = [],
  defaultSort = 'createdAt',
  enableTrashView = false,
}: {
  fetcher: (params: {
    q: string
    page: number
    limit: number
    sortBy: string
    sortOrder: string
    showTrash?: boolean
  }) => Promise<{ data: T[]; total: number; grandTotalCount: number }>
  initialColumns?: ColumnDef<T, any>[]
  defaultSort?: string
  enableTrashView?: boolean
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
  const [showTrash, setShowTrash] = useState(false)

  const fetchData = useCallback(async (targetPage?: number) => {
    setLoading(true)
    setError(null)
    
    const sortBy = sorting.length ? sorting[0].id : defaultSort
    const sortOrder = sorting.length && !sorting[0].desc ? 'asc' : 'desc'
    
    const pageToFetch = targetPage !== undefined ? targetPage + 1 : pageIndex + 1

    try {
      const res = await fetcher({
        q: globalFilter,
        page: pageToFetch,
        limit: pageSize,
        sortBy,
        sortOrder,
        ...(enableTrashView && { showTrash }),
      })
      
      setData(res.data)
      setTotalCount(res.total)
      setGrandTotalCount(res.grandTotalCount)
      
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
  }, [fetcher, globalFilter, pageIndex, pageSize, sorting, defaultSort, enableTrashView, showTrash])

  useEffect(() => {
    if (pendingPage !== null && pendingPage !== pageIndex) {
      fetchData(pendingPage)
    }
  }, [pendingPage, pageIndex, fetchData])

  useEffect(() => {
    fetchData()
  }, [globalFilter, pageSize, sorting, defaultSort, showTrash])

  const handlePageChange = useCallback((newPage: number) => {
    setPendingPage(newPage)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPageIndex(0)
    setPendingPage(0)
  }, [])

  const handleTrashClick = useCallback(() => {
    setShowTrash(true)
    setPageIndex(0)
  }, [])

  const handleStoreClick = useCallback(() => {
    setShowTrash(false)
    setPageIndex(0)
  }, [])

  const toggleTrashView = useCallback(() => {
    setShowTrash(prev => !prev)
    setPageIndex(0)
  }, [])

  // Return properly typed view indicator
  const viewIndicator: ViewIndicatorConfig | null = enableTrashView ? {
    show: true,
    type: showTrash ? 'trash' : 'store',
    message: showTrash ? 'Showing deleted records' : 'Showing store records',
    iconType: showTrash ? 'trash' : 'store',
    bgColor: showTrash ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: showTrash ? 'border-orange-300 dark:border-orange-700' : 'border-blue-300 dark:border-blue-700',
    textColor: showTrash ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'
  } : null

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
    showTrash,
    setPageIndex: handlePageChange,
    setPageSize: handlePageSizeChange,
    setGlobalFilter,
    setSorting: setSorting as OnChangeFn<SortingState>,
    fetchData: () => fetchData(),
    refresh: () => fetchData(pageIndex),
    handleTrashClick,
    handleStoreClick,
    toggleTrashView,
    setShowTrash,
    viewIndicator,
  }
}