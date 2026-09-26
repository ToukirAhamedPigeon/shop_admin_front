// src/modules/profile/ChangePassword.tsx
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { useAppSelector } from "@/hooks/useRedux"
import { changePasswordRequest } from "../api"
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

  if (step === 'verification') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        <div className="relative rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 p-6">
          <div className="relative z-10 text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t("Check Your Email")}
              </h3>

              <p className="text-sm text-muted-foreground mb-2">
                {t("We've sent a verification link to")}
              </p>
              <p className="text-sm font-semibold text-foreground bg-muted inline-block px-3 py-1 rounded-lg">
                {userEmail}
              </p>
            </div>

            {/* Next Steps Card */}
            <div className="p-4 rounded-xl text-left bg-muted/50 border border-border">
              <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {t("Next steps:")}
              </p>
              <ol className="text-xs text-foreground/80 list-decimal pl-4 space-y-2">
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
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1 transition-colors"
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
      <div className="relative rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 p-6">
        <div className="relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-3 pb-4 border-b border-border">
              <div className="flex justify-center">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Key className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t("Change Password")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
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
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    {t("Security Notice")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("For security, you'll need to verify this change via email. Your password won't be changed until you click the verification link.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                type="submit"
                className="w-full sm:w-auto"
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