// src/components/custom/ToastContainer.tsx
import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/redux/store"
import { removeToast } from "@/redux/slices/toastSlice"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"
import type { Toast } from "@/redux/slices/toastSlice"

const typeStyles: Record<
  Toast["type"],
  { iconBg: string; icon: React.ReactElement | null; accent: string }
> = {
  success: {
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />,
    accent: "bg-emerald-500"
  },
  danger: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    icon: <XCircle className="text-red-600 dark:text-red-400" />,
    accent: "bg-red-500"
  },
  warning: {
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    icon: <AlertTriangle className="text-amber-600 dark:text-amber-400" />,
    accent: "bg-amber-500"
  },
  info: {
    iconBg: "bg-primary/10",
    icon: <Info className="text-primary" />,
    accent: "bg-primary"
  },
  custom: {
    iconBg: "bg-muted",
    icon: null,
    accent: "bg-muted-foreground"
  },
}

const positionClasses: Record<Toast["position"], string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
}

const positions = Object.keys(positionClasses) as Toast["position"][]

const animationVariants: Record<
  Toast["animation"],
  { initial: any; animate: any; exit: any }
> = {
  "slide-right-in": {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 50, opacity: 0 },
  },
  "slide-left-in": {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  },
  "slide-up-in": {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 50, opacity: 0 },
  },
  "slide-down-in": {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
  },
  "fade-in": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
}

export default function ToastContainer() {
  const toasts = useSelector((state: RootState) => state.toast.toasts)
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const timers = toasts
      .filter((t) => t.duration > 0)
      .map((t) => setTimeout(() => dispatch(removeToast(t.id)), t.duration))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dispatch])

  return (
    <>
      {positions.map((pos) => (
        <div key={pos} className={`fixed z-[9999] ${positionClasses[pos]} space-y-3`}>
          <AnimatePresence>
            {toasts
              .filter((t) => t.position === pos)
              .map((toast) => {
                const style = typeStyles[toast.type]
                const anim = animationVariants[toast.animation]

                return (
                  <motion.div
                    key={toast.id}
                    initial={anim.initial}
                    animate={anim.animate}
                    exit={anim.exit}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                    className="relative overflow-hidden"
                  >
                    <div className="relative flex items-center gap-3 rounded-xl shadow-md p-4 min-w-[320px] bg-popover border border-border">
                      {/* Colored accent line */}
                      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${style.accent}`} />

                      {/* Icon */}
                      <div className={`p-2 rounded-xl ${style.iconBg}`}>
                        {style.icon}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {toast.message}
                        </p>
                      </div>

                      {toast.showClose && (
                        <button
                          onClick={() => dispatch(removeToast(toast.id))}
                          className="p-1 rounded-lg hover:bg-accent transition-colors"
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </div>
      ))}
    </>
  )
}