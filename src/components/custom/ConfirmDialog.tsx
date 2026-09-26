// src/components/custom/ConfirmDialog.tsx
'use client'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/hooks/useTranslations';
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  ShieldAlert,
  X
} from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string | ReactNode
  onCancel: () => void
  onConfirm: () => void
  onPermanentDelete?: () => void
  confirmLabel?: string
  cancelLabel?: string
  permanentDeleteLabel?: string
  loading?: boolean
  variant?: 'destructive' | 'success' | 'warning' | 'info'
  showCancelButton?: boolean
  showConfirmButton?: boolean
  showPermanentDeleteButton?: boolean
  permanentDeleteVariant?: 'destructive' | 'warning'
  children?: ReactNode
  icon?: ReactNode
  confirmButtonClassName?: string
  cancelButtonClassName?: string
}

const ConfirmDialog = ({
  open,
  title = 'Confirm',
  description = 'Are you sure?',
  onCancel,
  onConfirm,
  onPermanentDelete,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  permanentDeleteLabel = 'Permanently Delete',
  loading = false,
  variant = 'destructive',
  showCancelButton = true,
  showConfirmButton = true,
  showPermanentDeleteButton = false,
  permanentDeleteVariant = 'destructive',
  children,
  icon,
  confirmButtonClassName = '',
  cancelButtonClassName = ''
}: ConfirmDialogProps) => {
  const { t } = useTranslations();

  const getDefaultIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="w-6 h-6" />;
      case 'success':
        return <CheckCircle className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'info':
        return <Info className="w-6 h-6" />;
      default:
        return <ShieldAlert className="w-6 h-6" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconBg: 'bg-destructive/10',
          iconColor: 'text-destructive',
          titleColor: 'text-destructive',
          buttonVariant: 'destructive' as const,
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          titleColor: 'text-emerald-600 dark:text-emerald-400',
          buttonVariant: 'success' as const,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          titleColor: 'text-amber-600 dark:text-amber-400',
          buttonVariant: 'warning' as const,
        };
      case 'info':
        return {
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          titleColor: 'text-primary',
          buttonVariant: 'info' as const,
        };
      default:
        return {
          iconBg: 'bg-muted',
          iconColor: 'text-muted-foreground',
          titleColor: 'text-foreground',
          buttonVariant: 'default' as const,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md overflow-hidden p-0 rounded-xl shadow-2xl border-0 [&>button]:hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative rounded-xl overflow-hidden bg-card border border-border"
            >
              <div className="p-6 relative z-10">
                <DialogHeader className="space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Animated Icon */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex-shrink-0 size-10 rounded-full ${variantStyles.iconBg} flex items-center justify-center [&_svg]:size-5`}
                    >
                      {icon || (
                        <div className={variantStyles.iconColor}>
                          {getDefaultIcon()}
                        </div>
                      )}
                    </motion.div>

                    {/* Title */}
                    <div className="flex-1">
                      <DialogTitle className="text-lg font-semibold text-foreground pt-1.5">
                        {t(title)}
                      </DialogTitle>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={onCancel}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </DialogHeader>

                {/* Content */}
                <div className="mt-1 ml-14 text-sm">
                  {children ? (
                    <div className="text-muted-foreground space-y-3">
                      {children}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      {typeof description === 'string' ? t(description) : description}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                  {showCancelButton && (
                    <motion.div
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                        className={`px-4 ${cancelButtonClassName}`}
                      >
                        {t(cancelLabel)}
                      </Button>
                    </motion.div>
                  )}

                  {showPermanentDeleteButton && onPermanentDelete && (
                    <motion.div
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Button
                        variant={permanentDeleteVariant}
                        onClick={onPermanentDelete}
                        disabled={loading}
                        className={`px-4 ${confirmButtonClassName}`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('Deleting...')}
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t(permanentDeleteLabel)}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {showConfirmButton && (
                    <motion.div
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        variant={variantStyles.buttonVariant}
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 ${confirmButtonClassName}`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('Processing...')}
                          </>
                        ) : (
                          <>
                            {variant === 'destructive' && <Trash2 className="w-4 h-4 mr-2" />}
                            {variant === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                            {variant === 'warning' && <AlertTriangle className="w-4 h-4 mr-2" />}
                            {variant === 'info' && <Info className="w-4 h-4 mr-2" />}
                            {t(confirmLabel)}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </DialogFooter>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;