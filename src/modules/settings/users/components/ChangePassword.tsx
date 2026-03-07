import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { useAppSelector } from "@/hooks/useRedux"
import { changePasswordRequest, verifyPasswordChange } from "../api"
import { dispatchShowToast } from "@/lib/dispatch"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/custom/FormInputs"
import { useTranslations } from "@/hooks/useTranslations"

// Schema for password change request
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "Password must contain at least one number",
    })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
      message: "Password must contain at least one special character",
    }),
  confirm_new_password: z.string(),
}).refine((data) => data.new_password === data.confirm_new_password, {
  path: ['confirm_new_password'],
  message: "Passwords don't match",
})

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>


export default function ChangePassword() {
  const { t } = useTranslations()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verification'>('form')
  const userId = useAppSelector((state) => state.auth.user?.id)
  const userEmail = useAppSelector((state) => state.auth.user?.email)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_new_password: ""
    }
  })

  // Step 1: Request password change (send verification email)
  const onSubmit = async (data: ChangePasswordFormValues) => {
    setSubmitLoading(true)
    try {
      await changePasswordRequest({
        currentPassword: data.current_password,
        newPassword: data.new_password
      })

      setStep('verification')
      dispatchShowToast({ 
        type: "success", 
        message: t("Verification email sent to your registered email address") 
      })
      
      reset()
    } catch (err: any) {
      dispatchShowToast({
        type: "danger",
        message: err.response?.data?.message || err.response?.data || t("Failed to process request")
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  // Step 2: Handle verification from email link
  const handleVerifyToken = async (token: string) => {
    setSubmitLoading(true)
    try {
      await verifyPasswordChange(token)

      dispatchShowToast({ 
        type: "success", 
        message: t("Password changed successfully") 
      })
      
    } catch (err: any) {
      dispatchShowToast({
        type: "danger",
        message: err.response?.data?.message || err.response?.data || t("Verification failed")
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  // If this is the verification page (accessed via email link)
  // You'll need to extract token from URL in the parent component
  if (step === 'verification') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 space-y-4 max-w-md mx-auto"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            {t("Check Your Email")}
          </h3>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {t("We've sent a verification link to")}
          </p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-6">
            {userEmail}
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-left">
            <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
              <strong>{t("Next steps:")}</strong>
            </p>
            <ol className="text-xs text-blue-700 dark:text-blue-300 list-decimal pl-4 space-y-1">
              <li>{t("Click the link in the email we sent you")}</li>
              <li>{t("Your password will be changed immediately")}</li>
              <li>{t("You can continue using the app with your new password")}</li>
            </ol>
          </div>
          
          <p className="text-xs text-slate-500 mt-6">
            {t("Didn't receive the email?")}{" "}
            <button
              onClick={() => setStep('form')}
              className="text-blue-600 hover:underline font-medium"
            >
              {t("Try again")}
            </button>
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-md mx-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-4">
            <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            {t("Change Password")}
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t("A verification email will be sent to confirm this change")}
          </span>
        </div>

        <PasswordInput
          id="current_password"
          label={t("Current Password")}
          placeholder={t("Enter current password")}
          isRequiredStar={true}
          isHidden={true}
          {...register('current_password')}
          error={errors.current_password?.message}
        />

        <PasswordInput
          id="new_password"
          label={t("New Password")}
          placeholder={t("Enter new password")}
          isRequiredStar={true}
          isHidden={true}
          {...register('new_password')}
          error={errors.new_password?.message}
          helperText={t("Password must contain uppercase, lowercase, number and special character")}
        />

        <PasswordInput
          id="confirm_new_password"
          label={t("Confirm New Password")}
          placeholder={t("Confirm new password")}
          isRequiredStar={true}
          isHidden={true}
          {...register('confirm_new_password')}
          error={errors.confirm_new_password?.message}
          helperText={t("Passwords must match")}
        />

        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mt-4">
          <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span>{t("For security, you'll need to verify this change via email. Your password won't be changed until you click the verification link.")}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 border-t border-gray-300 pt-4">
          <Button 
            type="submit" 
            className="bg-amber-600 text-white hover:bg-amber-700 w-full sm:w-auto" 
            disabled={submitLoading}
          >
            {submitLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t("Sending...")}
              </span>
            ) : t("Send Verification")}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}