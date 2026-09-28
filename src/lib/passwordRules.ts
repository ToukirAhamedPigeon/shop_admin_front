// src/lib/passwordRules.ts
// One definition of a valid password: the zod schema and the live checklist
// (PasswordStrength) both read these rules. shop_back validates the same set.
import { z } from "zod"

export const PASSWORD_RULES = [
  { key: "length", label: "At least 6 characters", message: "Password must be at least 6 characters", test: (v: string) => v.length >= 6 },
  { key: "upper", label: "An uppercase letter", message: "Password must contain at least one uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { key: "lower", label: "A lowercase letter", message: "Password must contain at least one lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { key: "number", label: "A number", message: "Password must contain at least one number", test: (v: string) => /[0-9]/.test(v) },
  {
    key: "special",
    label: "A special character (!@#$…)",
    message: "Password must contain at least one special character",
    test: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v),
  },
] as const

/** A string that meets every rule, reporting the first rule it breaks. */
export const passwordSchema = PASSWORD_RULES.reduce<z.ZodString>(
  (schema, rule) => schema.refine(rule.test, { message: rule.message }),
  z.string()
)

export const STRENGTH = [
  { label: "Too weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Fair", bar: "bg-warning", text: "text-warning" },
  { label: "Good", bar: "bg-info", text: "text-info" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
] as const

/** 0 (empty) to 4: the rules met, with a bonus for length. */
export function strengthOf(value: string) {
  if (!value) return 0
  const met = PASSWORD_RULES.filter((r) => r.test(value)).length
  if (met < PASSWORD_RULES.length) return met <= 2 ? 1 : 2
  return value.length >= 12 ? 4 : 3
}
