// src/modules/settings/users/components/ChangePassword.tsx
import { useState } from "react"
import { Link } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AnimatePresence, motion } from "framer-motion"
import { useAppSelector } from "@/hooks/useRedux"
import { changePasswordRequest } from "../api"
import { dispatchShowToast } from "@/lib/dispatch"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/custom/FormInputs"
import { useTranslations } from "@/hooks/useTranslations"
import { cn } from "@/lib/utils"
import { can } from "@/lib/authCheck"
import {
  ArrowRight,
  Check,
  CircleCheck,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  RotateCcw,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react"

/** The rules a new password must meet. The schema and the live checklist both read this list. */
const PASSWORD_RULES = [
  { key: "length", label: "At least 6 characters", test: (v: string) => v.length >= 6 },
  { key: "upper", label: "An uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { key: "lower", label: "A lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { key: "number", label: "A number", test: (v: string) => /[0-9]/.test(v) },
  { key: "special", label: "A special character (!@#$…)", test: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
] as const

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .refine((val) => /[A-Z]/.test(val), { message: "Password must contain at least one uppercase letter" })
      .refine((val) => /[a-z]/.test(val), { message: "Password must contain at least one lowercase letter" })
      .refine((val) => /[0-9]/.test(val), { message: "Password must contain at least one number" })
      .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
        message: "Password must contain at least one special character",
      }),
    confirm_new_password: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    path: ["confirm_new_password"],
    message: "Passwords don't match",
  })
  .refine((data) => !data.new_password || data.new_password !== data.current_password, {
    path: ["new_password"],
    message: "The new password must be different from the current one",
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

const STRENGTH = [
  { label: "Too weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Fair", bar: "bg-warning", text: "text-warning" },
  { label: "Good", bar: "bg-info", text: "text-info" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
] as const

/** 0 (empty) to 4: the rules met, with a bonus for length. */
function strengthOf(value: string) {
  if (!value) return 0
  const met = PASSWORD_RULES.filter((r) => r.test(value)).length
  if (met < PASSWORD_RULES.length) return met <= 2 ? 1 : 2
  return value.length >= 12 ? 4 : 3
}

const PROFILE_PATH = "/settings/profile"

const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: "easeOut" } } as const

/** Enter → confirm by email → done. */
function Steps({ current }: { current: 1 | 2 }) {
  const { t } = useTranslations()
  const steps = [t("Enter passwords"), t("Confirm by email"), t("Password changed")]
  return (
    <ol className="flex items-center gap-2 text-xs" aria-label={t("Progress")}>
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-200",
                done && "border-success/40 bg-success/15 text-success",
                active && "border-primary bg-primary text-primary-foreground",
                !done && !active && "border-border bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" /> : n}
            </span>
            <span className={cn("hidden truncate sm:block", active ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
            {n < steps.length && <span className={cn("h-px min-w-3 flex-1", done ? "bg-success" : "bg-border")} aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}

function StrengthMeter({ value }: { value: string }) {
  const { t } = useTranslations()
  const score = strengthOf(value)
  const level = STRENGTH[score]
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-colors duration-200", i <= score ? level.bar : "bg-border")} />
          ))}
        </div>
        <span className={cn("w-16 text-right text-xs font-medium", value ? level.text : "text-muted-foreground")} aria-live="polite">
          {value ? t(level.label) : "—"}
        </span>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value)
          return (
            <li key={rule.key} className={cn("flex items-center gap-2 text-xs transition-colors duration-200", ok ? "text-success" : "text-muted-foreground")}>
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
                  ok ? "bg-success/15" : "bg-muted"
                )}
              >
                {ok ? <Check className="size-3" /> : <span className="size-1 rounded-full bg-muted-foreground/60" />}
              </span>
              {t(rule.label)}
              <span className="sr-only">{ok ? t("met") : t("not met")}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SideCard({ icon: Icon, title, children }: { icon: typeof Lock; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

export default function ChangePassword() {
  const { t } = useTranslations()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [step, setStep] = useState<"form" | "verification">("form")
  const userEmail = useAppSelector((state) => state.auth.user?.email)
  const canOpenProfile = can(["update-admin-profile"])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_new_password: "" },
  })

  const newPassword = useWatch({ control, name: "new_password" }) ?? ""
  const confirmPassword = useWatch({ control, name: "confirm_new_password" }) ?? ""
  const matches = !!confirmPassword && confirmPassword === newPassword

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setSubmitLoading(true)
    try {
      await changePasswordRequest({ currentPassword: data.current_password, newPassword: data.new_password })
      setStep("verification")
      dispatchShowToast({ type: "success", message: t("Verification email sent to your registered email address") })
      reset()
    } catch (err: any) {
      dispatchShowToast({
        type: "danger",
        message: err.response?.data?.message || err.response?.data || t("Failed to process request"),
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {/* Header */}
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{t("Set a new password")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("A verification email will be sent to confirm this change")}</p>
            </div>
          </div>
          <div className="mt-4">
            <Steps current={step === "form" ? 1 : 2} />
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === "form" ? (
            <motion.form key="form" {...fade} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 p-4 sm:p-6">
              <PasswordInput
                id="current_password"
                label={t("Current Password")}
                placeholder={t("Enter your current password")}
                autoComplete="current-password"
                isRequiredStar
                isHidden
                {...register("current_password")}
                error={errors.current_password?.message && t(errors.current_password.message)}
              />

              <div className="h-px bg-border" aria-hidden />

              <div className="space-y-2">
                <PasswordInput
                  id="new_password"
                  label={t("New Password")}
                  placeholder={t("Enter new password")}
                  autoComplete="new-password"
                  isRequiredStar
                  isHidden
                  aria-describedby="new-password-rules"
                  {...register("new_password")}
                  error={errors.new_password?.message && t(errors.new_password.message)}
                />
                <div id="new-password-rules">
                  <StrengthMeter value={newPassword} />
                </div>
              </div>

              <div className="space-y-1.5">
                <PasswordInput
                  id="confirm_new_password"
                  label={t("Confirm New Password")}
                  placeholder={t("Confirm your new password")}
                  autoComplete="new-password"
                  isRequiredStar
                  isHidden
                  {...register("confirm_new_password")}
                  error={errors.confirm_new_password?.message && t(errors.confirm_new_password.message)}
                />
                {confirmPassword && !errors.confirm_new_password && (
                  <p className={cn("flex items-center gap-1.5 text-xs", matches ? "text-success" : "text-muted-foreground")} aria-live="polite">
                    {matches ? <CircleCheck className="size-3.5" /> : <X className="size-3.5" />}
                    {matches ? t("Passwords match") : t("Passwords don't match yet")}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Mail className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    {t("The link goes to")} <span className="font-medium text-foreground break-all">{userEmail || t("your email")}</span>
                  </span>
                </p>
                <Button type="submit" className="w-full shrink-0 sm:w-auto" disabled={submitLoading}>
                  {submitLoading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  {submitLoading ? t("Sending...") : t("Send Verification Email")}
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div key="sent" {...fade} className="px-4 py-8 text-center sm:px-6 sm:py-10" role="status">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                <MailCheck className="size-7" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{t("Check Your Email")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("We've sent a verification link to")}</p>
              {userEmail && (
                <p className="mt-2 inline-block max-w-full break-all rounded-lg bg-muted px-3 py-1 text-sm font-medium text-foreground">{userEmail}</p>
              )}

              <ol className="mx-auto mt-6 max-w-sm space-y-2.5 text-left">
                {[
                  t("Click the verification link in the email we sent you"),
                  t("Your password will be changed immediately"),
                  t("You can continue using the app with your new password"),
                ].map((text, i) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-foreground/85">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    {text}
                  </li>
                ))}
              </ol>

              <div className="mt-7 flex justify-center">
                <Button variant="outline" size="sm" onClick={() => setStep("form")}>
                  <RotateCcw className="size-4" />
                  {t("Didn't receive it? Try again")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Guidance */}
      <aside className="space-y-4">
        <SideCard icon={ShieldCheck} title={t("How it works")}>
          <p className="text-sm text-muted-foreground">
            {t("For security, you'll need to verify this change via email. Your password won't be changed until you click the verification link.")}
          </p>
        </SideCard>
        <SideCard icon={Lock} title={t("A good password")}>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              t("Use 12 or more characters, or a short phrase"),
              t("Don't reuse a password from another site"),
              t("Avoid names, birthdays and common words"),
              t("A password manager can create and remember it"),
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                {tip}
              </li>
            ))}
          </ul>
        </SideCard>
        {canOpenProfile && (
          <Link
            to={PROFILE_PATH}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs transition-colors hover:bg-accent/50"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <UserRound className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{t("Back to profile")}</span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </aside>
    </div>
  )
}
