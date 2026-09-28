// src/components/custom/PasswordStrength.tsx
import { Check } from "lucide-react"
import { useTranslations } from "@/hooks/useTranslations"
import { PASSWORD_RULES, STRENGTH, strengthOf } from "@/lib/passwordRules"
import { cn } from "@/lib/utils"

/** Four-step strength bar and a live checklist of the password rules. */
export default function PasswordStrength({ value, id, className }: { value: string; id?: string; className?: string }) {
  const { t } = useTranslations()
  const score = strengthOf(value)
  const level = STRENGTH[score]
  return (
    <div id={id} className={cn("space-y-3 rounded-lg border border-border bg-muted/40 p-3", className)}>
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
              <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200", ok ? "bg-success/15" : "bg-muted")}>
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
