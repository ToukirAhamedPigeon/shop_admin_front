import { useState, useCallback, useEffect, useRef } from 'react'
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
  minLoadingTime = 500, // Add minimum loading time (default 500ms)
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
  minLoadingTime?: number // Add this
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
  
  // Refs for managing loading state
  const loadingStartTime = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pendingData = useRef<{ 
    data: T[]; 
    total: number; 
    grandTotalCount: number;
    targetPage?: number;
  } | null>(null)

  const fetchData = useCallback(async (targetPage?: number) => {
    setLoading(true)
    setError(null)
    loadingStartTime.current = Date.now()
    
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
      
      // Store the data temporarily
      pendingData.current = {
        data: res.data,
        total: res.total,
        grandTotalCount: res.grandTotalCount,
        targetPage
      }
      
      if (targetPage !== undefined) {
        setPendingPage(null)
      }

      // Calculate elapsed time
      const elapsedTime = Date.now() - (loadingStartTime.current || 0)
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)

      if (remainingTime > 0) {
        // Wait for remaining time to meet minimum loading duration
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          if (pendingData.current) {
            setData(pendingData.current.data)
            setTotalCount(pendingData.current.total)
            setGrandTotalCount(pendingData.current.grandTotalCount)
            
            if (pendingData.current.targetPage !== undefined) {
              setPageIndex(pendingData.current.targetPage)
            }
            
            setTimeout(() => {
              setLoading(false)
            }, minLoadingTime)
            pendingData.current = null
            timeoutRef.current = undefined
          }
        }, remainingTime)
      } else {
        // Already exceeded minimum time, update immediately
        setData(res.data)
        setTotalCount(res.total)
        setGrandTotalCount(res.grandTotalCount)
        
        if (targetPage !== undefined) {
          setPageIndex(targetPage)
        }
        
        setTimeout(() => {
          setLoading(false)
        }, minLoadingTime)
        pendingData.current = null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      console.error('Error fetching data:', err)
      setLoading(false)
      pendingData.current = null
      loadingStartTime.current = null
    }
  }, [fetcher, globalFilter, pageIndex, pageSize, sorting, defaultSort, enableTrashView, showTrash, minLoadingTime])

  useEffect(() => {
    if (pendingPage !== null && pendingPage !== pageIndex) {
      fetchData(pendingPage)
    }
  }, [pendingPage, pageIndex, fetchData])

  useEffect(() => {
    fetchData()
  }, [globalFilter, pageSize, sorting, defaultSort, showTrash])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

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