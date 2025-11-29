'use client'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/hooks/useTranslations';

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}

const ConfirmDialog = ({
  open,
  title = 'Confirm',
  description = 'Are you sure?',
  onCancel,
  onConfirm,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  loading = false,
}: ConfirmDialogProps) => {
  const { t } = useTranslations();
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(title)}</DialogTitle>
        </DialogHeader>
        <div className="text-gray-700 text-center sm:text-left">{t(description)}?</div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>{t(cancelLabel)}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {t(confirmLabel)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog