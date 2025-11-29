import { useState } from 'react'
import api from '@/lib/axios'
import { AxiosError } from 'axios'
import { dispatchShowToast } from '@/lib/dispatch'
import { useTranslations } from '@/hooks/useTranslations';

type UseDeleteWithConfirmProps = {
  endpoint: string
  onSuccess?: () => void
}

export function useDeleteWithConfirm({ endpoint, onSuccess }: UseDeleteWithConfirmProps) {
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
      const res = await api.delete(`${endpoint}/${itemToDelete}`, {
        withCredentials: true
      })
  
      const { status, message } = res.data
  
      if (status === 'deleted') {
        dispatchShowToast({
          type: 'success',
          message: t(message),
        })
      } else if (status === 'inactive') {
        dispatchShowToast({
          type: 'warning',
          message: t(message),
        })
      } else if (status === 'error') {
        dispatchShowToast({
          type: 'danger',
          message: t(message),
        })
      }
  
      onSuccess?.()
    } catch (error) {
      console.error('Delete error:', error)
      if (error instanceof AxiosError && error.response?.status === 403) {
        dispatchShowToast({
          type: 'warning',
          message: error.response.data.error || 'Item is not deletable',
        })
      } else {
        dispatchShowToast({
          type: 'danger',
          message: t('Error deleting item'),
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
