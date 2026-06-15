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
  RotateCcw, 
  ShieldAlert,
  FileWarning,
  Archive,
  X
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useRedux';

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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

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
          iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-500/20',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-red-600 dark:text-red-400',
          gradient: 'from-red-500/10 via-rose-500/5 to-red-500/10',
          buttonGradient: 'from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
          borderGlow: 'rgba(239, 68, 68, 0.5)'
        };
      case 'success':
        return {
          iconBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
          iconColor: 'text-green-600 dark:text-green-400',
          titleColor: 'text-green-600 dark:text-green-400',
          gradient: 'from-green-500/10 via-emerald-500/5 to-green-500/10',
          buttonGradient: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
          borderGlow: 'rgba(34, 197, 94, 0.5)'
        };
      case 'warning':
        return {
          iconBg: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          titleColor: 'text-yellow-600 dark:text-yellow-400',
          gradient: 'from-yellow-500/10 via-amber-500/5 to-yellow-500/10',
          buttonGradient: 'from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700',
          borderGlow: 'rgba(234, 179, 8, 0.5)'
        };
      case 'info':
        return {
          iconBg: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          titleColor: 'text-blue-600 dark:text-blue-400',
          gradient: 'from-blue-500/10 via-indigo-500/5 to-blue-500/10',
          buttonGradient: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
          borderGlow: 'rgba(59, 130, 246, 0.5)'
        };
      default:
        return {
          iconBg: 'bg-gradient-to-br from-gray-500/20 to-gray-600/20',
          iconColor: 'text-gray-600 dark:text-gray-400',
          titleColor: 'text-gray-900 dark:text-gray-100',
          gradient: 'from-gray-500/10 via-gray-600/5 to-gray-500/10',
          buttonGradient: 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
          borderGlow: 'rgba(107, 114, 128, 0.5)'
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md overflow-hidden p-0 rounded-2xl shadow-2xl border-0 [&>button]:hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative backdrop-blur-xl rounded-2xl overflow-hidden`}
              style={{
                background: isDarkMode
                  ? 'rgba(17, 24, 39, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
              }}
            >
              {/* Animated gradient border */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${variantStyles.borderGlow}, transparent 70%)`,
                }}
              />
              
              {/* Decorative top border */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-${variant === 'destructive' ? 'red' : variant === 'success' ? 'green' : variant === 'warning' ? 'yellow' : 'blue'}-500 to-transparent`} />

              <div className="p-6 relative z-10">
                <DialogHeader className="space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Animated Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                      className={`flex-shrink-0 w-14 h-14 rounded-2xl ${variantStyles.iconBg} backdrop-blur-sm flex items-center justify-center shadow-lg`}
                    >
                      {icon || (
                        <div className={variantStyles.iconColor}>
                          {getDefaultIcon()}
                        </div>
                      )}
                    </motion.div>

                    {/* Title */}
                    <div className="flex-1">
                      <DialogTitle className={`text-2xl font-bold ${variantStyles.titleColor} mb-2`}>
                        {t(title)}
                      </DialogTitle>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={onCancel}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
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
                <DialogFooter className="mt-8 pt-4 flex gap-3 sm:justify-end">
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
                        className={`rounded-xl px-6 border-2 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 ${cancelButtonClassName}`}
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
                        className={`rounded-xl px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r ${variantStyles.buttonGradient} text-white ${confirmButtonClassName}`}
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
                        className={`rounded-xl px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r ${variantStyles.buttonGradient} text-white ${confirmButtonClassName}`}
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