// src/components/custom/FormKit.tsx
// Layout pieces shared by the admin forms (Users add/edit, Profile, App
// Settings…). The inputs themselves live in FormInputs.tsx; these frame them.
import { useRef, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Camera, Loader2, Save, Trash2, UserRound, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/useTranslations"
import { cn } from "@/lib/utils"
import { initialsOf } from "@/lib/initials"

/** A titled card that groups related fields. */
export function FormSection({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  /** Something small on the right of the header (a link, a toggle). */
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-xs", className)}>
      <header className="flex items-start gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

/** Two columns from `md`, one below. Wrap a field in `md:col-span-2` to span both. */
export function FieldGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2", className)}>{children}</div>
}

/**
 * Round photo with a camera button and "Remove photo". Pairs with
 * useProfilePicture: pass its `preview`, `onDrop` and `clearImage`.
 */
export function AvatarPicker({
  preview,
  name,
  onDrop,
  onRemove,
  error,
  size = "lg",
  className,
}: {
  preview: string | null
  /** Used for the initials when there is no photo. */
  name: string
  onDrop: (accepted: File[], rejected: never[]) => void
  onRemove: () => void
  error?: string
  size?: "md" | "lg"
  className?: string
}) {
  const { t } = useTranslations()
  const inputRef = useRef<HTMLInputElement>(null)
  const box = size === "lg" ? "size-24 text-2xl" : "size-20 text-xl"
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        {preview ? (
          <img src={preview} alt="" className={cn("rounded-full object-cover ring-4 ring-card", box)} />
        ) : (
          <span className={cn("flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground ring-4 ring-card", box)}>
            {name.trim() ? initialsOf(name) : <UserRound className="size-1/2" aria-hidden />}
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={preview ? t("Change photo") : t("Add photo")}
          title={preview ? t("Change photo") : t("Add photo")}
          className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Camera className="size-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onDrop([file], [])
            e.target.value = ""
          }}
        />
      </div>
      {preview && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground outline-none transition-colors hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="size-3" />
          {t("Remove photo")}
        </button>
      )}
      {error && <p className="mt-1 max-w-48 text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** On/off switch. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  )
}

/** A labelled switch row: title and hint on the left, the switch on the right. */
export function SwitchField({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

/**
 * The "You have unsaved changes · Discard · Save" bar. The caller positions it
 * with `className` (sticky in a page, fixed or absolute in a panel). Without
 * `onSave` the Save button submits the surrounding form.
 */
export function UnsavedBar({
  show,
  saving,
  onDiscard,
  onSave,
  saveLabel,
  message,
  className,
}: {
  show: boolean
  saving?: boolean
  onDiscard: () => void
  onSave?: () => void
  saveLabel?: string
  message?: string
  className?: string
}) {
  const { t } = useTranslations()
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn("z-30", className)}
        >
          <div
            role="status"
            className="pointer-events-auto mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm"
          >
            <span className="size-2 shrink-0 rounded-full bg-warning" />
            <p className="mr-auto text-sm font-medium text-foreground">{message ?? t("You have unsaved changes")}</p>
            <Button type="button" variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
              {t("Discard")}
            </Button>
            <Button type={onSave ? "button" : "submit"} size="sm" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? t("Saving...") : saveLabel ?? t("Save changes")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Action row pinned to the bottom of a FormHolderSheet (whose content box has
 * px-6 pb-8, which this cancels so the bar spans the sheet). On phones the
 * status takes its own line and the buttons share the next.
 */
export function SheetFooter({ status, children }: { status?: ReactNode; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 -mb-8 mt-6 flex flex-wrap items-center gap-2 border-t border-border bg-card/95 px-6 py-3 backdrop-blur-sm [&>button]:flex-1 sm:[&>button]:flex-none">
      <div className="w-full min-w-0 text-xs text-muted-foreground sm:mr-auto sm:w-auto">{status}</div>
      {children}
    </div>
  )
}

/** Placeholder while a form's data loads: a few section-shaped blocks. */
export function FormSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      {Array.from({ length: sections }, (_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
            <div className="size-8 rounded-lg bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="h-14 rounded-md bg-muted/70" />
            <div className="h-14 rounded-md bg-muted/70" />
            {i === 0 && <div className="h-14 rounded-md bg-muted/70 md:col-span-2" />}
          </div>
        </div>
      ))}
    </div>
  )
}
