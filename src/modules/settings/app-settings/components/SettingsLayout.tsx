// src/modules/settings/app-settings/components/SettingsLayout.tsx
// Shared building blocks for the App Settings panels.
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A titled group of settings in one card. */
export function SettingsSection({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-xs">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

/** Label and hint on the left, the control on the right (stacked on phones). */
export function SettingRow({
  label,
  hint,
  htmlFor,
  children,
  stacked = false,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid gap-2 px-4 py-4 sm:px-5',
        !stacked && 'sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:items-center sm:gap-6'
      )}
    >
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** On/off switch. */
// Moved to FormKit so other forms can use it; kept here for existing imports.
export { Toggle } from '@/components/custom/FormKit';
