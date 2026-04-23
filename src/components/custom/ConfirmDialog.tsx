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
  RotateCcw, 
  ShieldAlert,
  FileWarning,
  Archive
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

  // Get icon based on variant
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

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-red-600 dark:text-red-400',
          borderTop: 'border-t-red-500',
          gradient: 'from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10'
        };
      case 'success':
        return {
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          titleColor: 'text-green-600 dark:text-green-400',
          borderTop: 'border-t-green-500',
          gradient: 'from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          titleColor: 'text-yellow-600 dark:text-yellow-400',
          borderTop: 'border-t-yellow-500',
          gradient: 'from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          titleColor: 'text-blue-600 dark:text-blue-400',
          borderTop: 'border-t-blue-500',
          gradient: 'from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10'
        };
      default:
        return {
          iconBg: 'bg-gray-100 dark:bg-gray-800',
          iconColor: 'text-gray-600 dark:text-gray-400',
          titleColor: 'text-gray-900 dark:text-gray-100',
          borderTop: 'border-t-gray-500',
          gradient: 'from-gray-50 to-gray-100/50 dark:from-gray-950/20 dark:to-gray-900/10'
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Button variants
  const getConfirmButtonVariant = () => {
    if (variant === 'success') return 'bg-green-600 hover:bg-green-700 text-white';
    if (variant === 'warning') return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    if (variant === 'info') return 'bg-blue-600 hover:bg-blue-700 text-white';
    return 'bg-red-600 hover:bg-red-700 text-white';
  };

  const getPermanentDeleteButtonVariant = () => {
    return permanentDeleteVariant === 'warning' 
      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
      : 'bg-red-700 hover:bg-red-800 text-white';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent 
        className="max-w-md overflow-hidden p-0 rounded-2xl shadow-2xl border-0 [&>button]:hidden"
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative bg-gradient-to-br ${variantStyles.gradient}`}
            >
              {/* Decorative top border */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${variantStyles.borderTop} opacity-60`} />

              <div className="p-6">
                <DialogHeader className="space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                      className={`flex-shrink-0 w-12 h-12 rounded-full ${variantStyles.iconBg} flex items-center justify-center`}
                    >
                      {icon || (
                        <div className={variantStyles.iconColor}>
                          {getDefaultIcon()}
                        </div>
                      )}
                    </motion.div>

                    {/* Title */}
                    <div className="flex-1">
                      <DialogTitle className={`text-xl font-bold ${variantStyles.titleColor} mb-2`}>
                        {t(title)}
                      </DialogTitle>
                    </div>
                  </div>
                </DialogHeader>

                {/* Content */}
                <div className="mt-4 ml-16">
                  {children ? (
                    <div className="text-gray-700 dark:text-gray-300 space-y-3">
                      {children}
                    </div>
                  ) : (
                    <div className="text-gray-700 dark:text-gray-300">
                      {typeof description === 'string' ? t(description) : description}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <DialogFooter className="mt-6 pt-4 flex gap-3 sm:justify-end">
                  {showCancelButton && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                        className={`rounded-full px-6 border-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ${cancelButtonClassName}`}
                      >
                        {t(cancelLabel)}
                      </Button>
                    </motion.div>
                  )}
                  
                  {showPermanentDeleteButton && onPermanentDelete && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Button
                        onClick={onPermanentDelete}
                        disabled={loading}
                        className={`rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-200 ${getPermanentDeleteButtonVariant()} ${confirmButtonClassName}`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-200 ${getConfirmButtonVariant()} ${confirmButtonClassName}`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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