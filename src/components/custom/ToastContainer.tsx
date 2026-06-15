// src/components/custom/ToastContainer.tsx
import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/redux/store"
import { removeToast } from "@/redux/slices/toastSlice"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"
import type { Toast } from "@/redux/slices/toastSlice"
import { useAppSelector } from "@/hooks/useRedux"

const typeStyles: Record<
  Toast["type"],
  { gradient: string; icon: React.ReactElement | null; borderGlow: string }
> = {
  success: {
    gradient: "from-green-500/20 to-emerald-500/20",
    icon: <CheckCircle2 className="text-green-500" />,
    borderGlow: "rgba(34, 197, 94, 0.5)"
  },
  danger: {
    gradient: "from-red-500/20 to-rose-500/20",
    icon: <XCircle className="text-red-500" />,
    borderGlow: "rgba(239, 68, 68, 0.5)"
  },
  warning: {
    gradient: "from-yellow-500/20 to-amber-500/20",
    icon: <AlertTriangle className="text-yellow-500" />,
    borderGlow: "rgba(234, 179, 8, 0.5)"
  },
  info: {
    gradient: "from-blue-500/20 to-indigo-500/20",
    icon: <Info className="text-blue-500" />,
    borderGlow: "rgba(59, 130, 246, 0.5)"
  },
  custom: {
    gradient: "from-gray-500/20 to-gray-600/20",
    icon: null,
    borderGlow: "rgba(107, 114, 128, 0.5)"
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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark'

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
                    {/* Glow effect */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-30"
                      style={{
                        background: `radial-gradient(circle at 0% 50%, ${style.borderGlow}, transparent 70%)`,
                      }}
                    />
                    
                    <div
                      className={`relative flex items-center gap-3 rounded-xl shadow-2xl p-4 min-w-[320px] backdrop-blur-xl border`}
                      style={{
                        background: isDarkMode
                          ? 'rgba(17, 24, 39, 0.95)'
                          : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                      }}
                    >
                      {/* Colored accent line */}
                      <div
                        className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
                        style={{
                          background: `linear-gradient(180deg, ${style.borderGlow}, transparent)`,
                        }}
                      />
                      
                      {/* Icon with gradient background */}
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${style.gradient} backdrop-blur-sm`}>
                        {style.icon}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {toast.message}
                        </p>
                      </div>

                      {toast.showClose && (
                        <button
                          onClick={() => dispatch(removeToast(toast.id))}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
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