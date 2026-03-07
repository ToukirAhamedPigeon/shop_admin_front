import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { verifyPasswordChange } from "../api"
import { dispatchShowToast } from "@/lib/dispatch"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/useTranslations"

export default function VerifyPasswordChange() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { t } = useTranslations()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false)
        return
      }

      try {
        await verifyPasswordChange(token)
        setSuccess(true)
        dispatchShowToast({
          type: "success",
          message: t("Password changed successfully")
        })
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (err: any) {
        dispatchShowToast({
          type: "danger",
          message: err.response?.data?.message || t("Invalid or expired verification link")
        })
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token, navigate, t])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        {verifying ? (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 mb-4">
              <svg className="animate-spin h-12 w-12 text-amber-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {t("Verifying your password change")}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t("Please wait while we process your request...")}
            </p>
          </div>
        ) : success ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {t("Password Changed Successfully!")}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {t("Your password has been updated. You'll be redirected to login page.")}
            </p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              {t("Go to Login")}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {t("Verification Failed")}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {t("The verification link is invalid or has expired.")}
            </p>
            <Button onClick={() => navigate('/change-password')} className="mt-4">
              {t("Request New Link")}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}