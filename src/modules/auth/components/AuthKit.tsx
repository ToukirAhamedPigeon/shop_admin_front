// Building blocks for the public pages rendered inside AuthShell, so login,
// password reset, email verification and error pages share one look.
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type useAnimationControls } from "framer-motion";
import type { UseFormRegisterReturn } from "react-hook-form";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpotlightCard } from "@/components/aceternity/spotlight-card";
import { GlowField } from "@/components/aceternity/glow-field";
import { cn } from "@/lib/utils";
import { EASE, authContainer, authItem } from "./authMotion";

export function AuthCard({
  children,
  shake,
  className,
}: {
  children: ReactNode;
  shake?: ReturnType<typeof useAnimationControls>;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full max-w-[400px]", className)}>
      <motion.div animate={shake}>
        <SpotlightCard>
          <motion.div variants={authContainer} initial="hidden" animate="show" className="p-8 sm:p-9">
            {children}
          </motion.div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}

const toneStyles = {
  primary: "bg-primary/10 text-primary ring-primary/20",
  success: "bg-success/10 text-success ring-success/25",
  destructive: "bg-destructive/10 text-destructive ring-destructive/25",
};

export function AuthHeading({
  title,
  subtitle,
  icon: Icon,
  tone = "primary",
  logo = true,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof toneStyles;
  /** Show the app logo on mobile when there is no icon (the brand panel shows it on desktop). */
  logo?: boolean;
}) {
  return (
    <motion.div variants={authItem} className="mb-8">
      {Icon ? (
        <span className={cn("mb-5 flex size-11 items-center justify-center rounded-xl ring-1", toneStyles[tone])}>
          <Icon className="size-5" />
        </span>
      ) : logo ? (
        // The brand panel carries the logo on desktop.
        <img src="/logo.png" alt="" width={40} height={40} className="mb-5 lg:hidden" />
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return (
    <motion.p
      initial={false}
      animate={{ opacity: message ? 1 : 0, height: message ? "auto" : 0 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden text-xs text-destructive"
      role={message ? "alert" : undefined}
    >
      {message}
    </motion.p>
  );
}

const inputClass = "h-11 rounded-[7px] border-0 bg-card dark:bg-card pl-10 shadow-none focus-visible:ring-0";

type FieldProps = {
  id: string;
  label: string;
  icon: LucideIcon;
  registration: UseFormRegisterReturn;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  /** Extra element on the label row, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
};

export function AuthField({
  id,
  label,
  icon: Icon,
  registration,
  error,
  labelAside,
  type = "text",
  ...inputProps
}: FieldProps & { type?: string }) {
  return (
    <motion.div variants={authItem} className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {labelAside}
      </div>
      <GlowField invalid={!!error}>
        <div className="relative">
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id={id} type={type} aria-invalid={!!error} {...inputProps} {...registration} className={inputClass} />
        </div>
      </GlowField>
      <FieldError message={error} />
    </motion.div>
  );
}

export function PasswordField({ id, label, icon: Icon, registration, error, labelAside, ...inputProps }: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <motion.div variants={authItem} className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {labelAside}
      </div>
      <GlowField invalid={!!error}>
        <div className="relative">
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={!!error}
            {...inputProps}
            {...registration}
            className={cn(inputClass, "pr-10")}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </GlowField>
      <FieldError message={error} />
    </motion.div>
  );
}

const primaryButton = cn(
  "login-shimmer group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg",
  "bg-primary text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25",
  "transition-[box-shadow,opacity,transform] duration-200 hover:shadow-xl hover:shadow-primary/30 active:translate-y-px",
  "disabled:cursor-not-allowed disabled:opacity-70 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
);

const secondaryButton = cn(
  "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-input bg-card text-sm font-medium text-foreground",
  "transition-colors duration-150 hover:bg-accent outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
);

export function AuthSubmit({ busy, busyLabel, children }: { busy?: boolean; busyLabel: string; children: ReactNode }) {
  return (
    <motion.div variants={authItem} className="pt-1">
      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {busyLabel}
          </>
        ) : (
          <>
            {children}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </motion.div>
  );
}

/** Link or click action styled as the primary / secondary button. */
export function AuthAction({
  to,
  onClick,
  variant = "primary",
  icon: Icon,
  children,
}: {
  to?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
  children: ReactNode;
}) {
  const cls = variant === "primary" ? primaryButton : secondaryButton;
  const content = (
    <>
      {Icon && <Icon className="size-4" />}
      {children}
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}

export function BackToLogin({ label }: { label: string }) {
  return (
    <motion.div variants={authItem} className="mt-6 flex justify-center">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {label}
      </Link>
    </motion.div>
  );
}

/** Result state inside a card: loading, success or failure. */
export function AuthStatus({
  state,
  title,
  message,
  children,
}: {
  state: "loading" | "success" | "error";
  title: string;
  message?: ReactNode;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const ring =
    state === "success"
      ? "bg-success/10 text-success ring-success/25"
      : state === "error"
        ? "bg-destructive/10 text-destructive ring-destructive/25"
        : "bg-primary/10 text-primary ring-primary/20";

  return (
    <div className="flex flex-col items-center text-center" role={state === "error" ? "alert" : "status"} aria-live="polite">
      <motion.div
        variants={authItem}
        className={cn("mb-6 flex size-16 items-center justify-center rounded-full ring-1", ring)}
      >
        {state === "loading" && <Loader2 className="size-7 animate-spin" />}
        {state !== "loading" && (
          <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            {state === "success" ? (
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
              />
            ) : (
              <motion.path
                d="M7 7l10 10M17 7L7 17"
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.25, ease: EASE }}
              />
            )}
          </svg>
        )}
      </motion.div>
      <motion.h1 variants={authItem} className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </motion.h1>
      {message && (
        <motion.p variants={authItem} className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {message}
        </motion.p>
      )}
      {children && (
        <motion.div variants={authItem} className="mt-8 flex w-full flex-col gap-3">
          {children}
        </motion.div>
      )}
    </div>
  );
}

/** Big status code for error pages (404, 403), with a soft gradient fill. */
export function ErrorCode({ code }: { code: string }) {
  return (
    <motion.p
      variants={authItem}
      aria-hidden
      className="auth-error-code mb-2 select-none text-7xl font-semibold leading-none tracking-tighter"
    >
      {code}
    </motion.p>
  );
}
