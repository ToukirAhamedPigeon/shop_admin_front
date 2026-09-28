import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { CircleCheck, CircleX, KeyRound, Loader2, LogIn, RotateCcw } from "lucide-react"
import { verifyPasswordChange } from "../api"
import { dispatchShowToast } from "@/lib/dispatch"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/useTranslations"
import { cn } from "@/lib/utils"

const REDIRECT_SECONDS = 5

type Status = "verifying" | "success" | "failed"

export default function VerifyPasswordChange() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { t } = useTranslations()
  const [status, setStatus] = useState<Status>(token ? "verifying" : "failed")
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS)
  // A token works once. StrictMode (and a changing `t`) would run the effect
  // again and turn a success into "invalid link", so each token is sent once.
  const sentFor = useRef<string | null>(null)
  const tRef = useRef(t)
  tRef.current = t

  useEffect(() => {
    if (!token || sentFor.current === token) return
    sentFor.current = token
    setStatus("verifying")
    verifyPasswordChange(token)
      .then(() => {
        setStatus("success")
        dispatchShowToast({ type: "success", message: tRef.current("Password changed successfully") })
      })
      .catch((err: any) => {
        setStatus("failed")
        dispatchShowToast({
          type: "danger",
          message: err.response?.data?.message || tRef.current("Invalid or expired verification link"),
        })
      })
  }, [token])

  // After a success, count down and go to sign in.
  useEffect(() => {
    if (status !== "success") return
    if (seconds <= 0) {
      navigate("/login")
      return
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [status, seconds, navigate])

  const view = {
    verifying: {
      icon: <Loader2 className="size-7 animate-spin" />,
      tone: "bg-primary/10 text-primary",
      title: t("Verifying your password change"),
      message: t("Please wait while we process your request..."),
    },
    success: {
      icon: <CircleCheck className="size-7" />,
      tone: "bg-success/10 text-success",
      title: t("Password Changed Successfully!"),
      message: t("Your password has been updated. You'll be redirected to login page."),
    },
    failed: {
      icon: <CircleX className="size-7" />,
      tone: "bg-destructive/10 text-destructive",
      title: t("Verification Failed"),
      message: t("The verification link is invalid or has expired."),
    },
  }[status]

  return (
    <div className="mx-auto w-full max-w-md py-4 sm:py-8">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm font-medium text-muted-foreground">
          <KeyRound className="size-4" />
          {t("Change Password")}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="px-5 py-8 text-center sm:px-8"
            role="status"
            aria-live="polite"
          >
            <span className={cn("mx-auto flex size-14 items-center justify-center rounded-2xl", view.tone)}>{view.icon}</span>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{view.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{view.message}</p>

            {status === "success" && (
              <>
                <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className="h-full rounded-full bg-success transition-[width] duration-1000 ease-linear"
                    style={{ width: `${((REDIRECT_SECONDS - seconds) / REDIRECT_SECONDS) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {t("Redirecting in")} {seconds}s
                </p>
                <Button onClick={() => navigate("/login")} className="mt-5">
                  <LogIn className="size-4" />
                  {t("Go to Login")}
                </Button>
              </>
            )}
            {status === "failed" && (
              <Button onClick={() => navigate("/settings/change-password")} className="mt-6">
                <RotateCcw className="size-4" />
                {t("Request New Link")}
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
