import { useState } from 'react'
import api from '@/lib/axios'
import { AxiosError } from 'axios'
import { dispatchShowToast } from '@/lib/dispatch'
import { useTranslations } from '@/hooks/useTranslations';

type UseDeleteWithConfirmProps = {
  endpoint?: string
  deleteFunction?: (id: string) => Promise<any>
  onSuccess?: () => void
  successMessage?: string
  errorMessage?: string
  inactiveMessage?: string
}

export function useDeleteWithConfirm({ 
  endpoint,
  deleteFunction,
  onSuccess,
  successMessage = 'Item deleted successfully',
  errorMessage = 'Error deleting item',
  inactiveMessage = 'Item is not deletable'
}: UseDeleteWithConfirmProps) {
  const { t } = useTranslations();
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const confirmDelete = (id: string) => {
    setItemToDelete(id)
    setDialogOpen(true)
  }

  const cancelDelete = () => {
    setItemToDelete(null)
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleteLoading(true) // start loading
  
    try {
      let res;
      
      if (deleteFunction) {
        // Use the provided delete function
        res = await deleteFunction(itemToDelete)
      } else if (endpoint) {
        // Fallback to API call with endpoint
        res = await api.delete(`${endpoint}/${itemToDelete}`, {
          withCredentials: true
        })
      } else {
        throw new Error('Either endpoint or deleteFunction must be provided')
      }
  
      const { status, message } = res.data
  
      if (status === 'deleted') {
        dispatchShowToast({
          type: 'success',
          message: t(message || successMessage),
        })
      } else if (status === 'inactive') {
        dispatchShowToast({
          type: 'warning',
          message: t(message || inactiveMessage),
        })
      } else if (status === 'error') {
        dispatchShowToast({
          type: 'danger',
          message: t(message || errorMessage),
        })
      }
  
      onSuccess?.()
    } catch (error) {
      console.error('Delete error:', error)
      if (error instanceof AxiosError && error.response?.status === 403) {
        dispatchShowToast({
          type: 'warning',
          message: error.response.data.error || t(inactiveMessage),
        })
      } else {
        dispatchShowToast({
          type: 'danger',
          message: t(errorMessage),
        })
      }
    } finally {
      setDeleteLoading(false) // end loading
      cancelDelete()
    }
  }

  return {
    dialogOpen,
    confirmDelete,
    cancelDelete,
    handleDelete,
    deleteLoading,
  }
}