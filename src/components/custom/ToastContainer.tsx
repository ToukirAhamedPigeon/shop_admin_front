// src/components/ToastContainer.tsx
import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/redux/store"
import { removeToast } from "@/redux/slices/toastSlice"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"
import type { Toast } from "@/redux/slices/toastSlice"

const typeStyles: Record<
  Toast["type"],
  { bg: string; icon: React.ReactElement | null }
> = {
  success: {
    bg: "bg-green-50 border-green-500 text-green-700",
    icon: <CheckCircle2 className="text-green-500" />,
  },
  danger: {
    bg: "bg-red-50 border-red-500 text-red-700",
    icon: <XCircle className="text-red-500" />,
  },
  warning: {
    bg: "bg-yellow-50 border-yellow-500 text-yellow-700",
    icon: <AlertTriangle className="text-yellow-500" />,
  },
  info: {
    bg: "bg-blue-50 border-blue-500 text-blue-700",
    icon: <Info className="text-blue-500" />,
  },
  custom: {
    bg: "bg-gray-100 border-gray-500 text-gray-700",
    icon: null,
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

const positions = Object.keys(
  positionClasses
) as Toast["position"][]

const animationVariants: Record<
  Toast["animation"],
  {
    initial: any
    animate: any
    exit: any
  }
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
  const toasts = useSelector(
    (state: RootState) => state.toast.toasts
  )

  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const timers = toasts
      .filter((t) => t.duration > 0)
      .map((t) =>
        setTimeout(
          () => dispatch(removeToast(t.id)),
          t.duration
        )
      )

    return () => timers.forEach(clearTimeout)
  }, [toasts, dispatch])

  return (
    <>
      {positions.map((pos) => (
        <div
          key={pos}
          className={`fixed z-[9999] ${positionClasses[pos]} space-y-2`}
        >
          <AnimatePresence>
            {toasts
              .filter((t) => t.position === pos)
              .map((toast) => {
                const style = typeStyles[toast.type]
                const anim =
                  animationVariants[toast.animation]

                return (
                  <motion.div
                    key={toast.id}
                    initial={anim.initial}
                    animate={anim.animate}
                    exit={anim.exit}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-3 border-l-4 rounded-xl shadow-lg p-4 w-80 ${style.bg}`}
                  >
                    {style.icon && <div>{style.icon}</div>}

                    <div className="flex-1 text-sm font-medium">
                      {toast.message}
                    </div>

                    {toast.showClose && (
                      <button
                        onClick={() =>
                          dispatch(removeToast(toast.id))
                        }
                        className="text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </div>
      ))}
    </>
  )
}
