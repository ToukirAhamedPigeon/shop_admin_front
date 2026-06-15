// src/modules/profile/ChangePassword.tsx
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
import { Key, Shield, Mail, CheckCircle, ArrowLeft, Loader2 } from "lucide-react"

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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark'

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

  if (step === 'verification') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        <div
          className="relative rounded-2xl backdrop-blur-xl transition-all duration-300 p-6"
          style={{
            background: isDarkMode
              ? 'rgba(17, 24, 39, 0.4)'
              : 'rgba(255, 255, 255, 0.55)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
            boxShadow: isDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {/* Animated gradient border overlay */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(100,120,255,0.08), rgba(180,100,255,0.05))',
            }}
          />
          
          {/* Colored accent line at top */}
          <div
            className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${isDarkMode ? '#14b8a6' : '#14b8a6'}, ${isDarkMode ? '#0d9488' : '#0d9488'}, transparent)`,
            }}
          />

          <div className="relative z-10 text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2">
                {t("Check Your Email")}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t("We've sent a verification link to")}
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100/50 dark:bg-gray-800/50 inline-block px-3 py-1 rounded-lg">
                {userEmail}
              </p>
            </div>
            
            {/* Next Steps Card */}
            <div
              className="p-4 rounded-xl text-left backdrop-blur-sm"
              style={{
                background: isDarkMode
                  ? 'rgba(0, 0, 0, 0.2)'
                  : 'rgba(255, 255, 255, 0.4)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)'}`,
              }}
            >
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {t("Next steps:")}
              </p>
              <ol className="text-xs text-gray-700 dark:text-gray-300 list-decimal pl-4 space-y-2">
                <li>{t("Click the verification link in the email we sent you")}</li>
                <li>{t("Your password will be changed immediately")}</li>
                <li>{t("You can continue using the app with your new password")}</li>
              </ol>
            </div>
            
            {/* Try Again Link */}
            <div className="pt-2">
              <p className="text-xs text-gray-500">
                {t("Didn't receive the email?")}{" "}
                <button
                  onClick={() => setStep('form')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {t("Try again")}
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <div
        className="relative rounded-2xl backdrop-blur-xl transition-all duration-300 p-6"
        style={{
          background: isDarkMode
            ? 'rgba(17, 24, 39, 0.4)'
            : 'rgba(255, 255, 255, 0.55)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {/* Animated gradient border overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(100,120,255,0.08), rgba(180,100,255,0.05))',
          }}
        />
        
        {/* Colored accent line at top - Amber/Orange theme */}
        <div
          className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${isDarkMode ? '#f59e0b' : '#f97316'}, ${isDarkMode ? '#d97706' : '#ea580c'}, transparent)`,
          }}
        />

        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-3 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex justify-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <Key className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  {t("Change Password")}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("A verification email will be sent to confirm this change")}
                </p>
              </div>
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <PasswordInput
                id="current_password"
                label={t("Current Password")}
                placeholder={t("Enter your current password")}
                isRequiredStar={true}
                isHidden={true}
                {...register('current_password')}
                error={errors.current_password?.message}
              />

              <div className="relative">
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
              </div>

              <PasswordInput
                id="confirm_new_password"
                label={t("Confirm New Password")}
                placeholder={t("Confirm your new password")}
                isRequiredStar={true}
                isHidden={true}
                {...register('confirm_new_password')}
                error={errors.confirm_new_password?.message}
                helperText={t("Passwords must match")}
              />
            </div>

            {/* Security Note */}
            <div
              className="p-4 rounded-xl backdrop-blur-sm"
              style={{
                background: isDarkMode
                  ? 'rgba(0, 0, 0, 0.2)'
                  : 'rgba(255, 255, 255, 0.4)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)'}`,
              }}
            >
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {t("Security Notice")}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t("For security, you'll need to verify this change via email. Your password won't be changed until you click the verification link.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("Sending...")}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {t("Send Verification Email")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}