// src/components/custom/ChipSelect.tsx
// A short list of names as toggle chips (roles, for example). For a long,
// grouped list of permissions use PermissionPicker instead.
import { Check, RotateCw } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useOptionNames } from '@/hooks/useOptionNames';
import { capitalize } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface ChipSelectProps {
  id: string;
  label: string;
  /** Options endpoint, e.g. "/Options/roles". */
  url: string;
  value: string[];
  onChange: (value: string[]) => void;
  isRequired?: boolean;
  error?: string;
  hint?: string;
}

export default function ChipSelect({ id, label, url, value, onChange, isRequired, error, hint }: ChipSelectProps) {
  const { t } = useTranslations();
  const { names, status, reload } = useOptionNames(url);
  // Keep selected names the list doesn't know (renamed or inactive) visible.
  const all = [...new Set([...names, ...value])];
  const toggle = (name: string) => onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]);

  return (
    <div className="space-y-1.5" role="group" aria-labelledby={`${id}-label`} aria-describedby={error ? `${id}-error` : undefined}>
      <div className="flex items-baseline justify-between gap-2">
        <p id={`${id}-label`} className="text-sm font-medium text-foreground/80">
          {t(label)} {isRequired && <span className="text-destructive">*</span>}
        </p>
        {value.length > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {value.length} {t('selected')}
          </span>
        )}
      </div>

      {status === 'loading' && all.length === 0 ? (
        <div className="flex flex-wrap gap-2" aria-hidden>
          {[64, 88, 72, 56].map((w) => (
            <span key={w} className="h-8 animate-pulse rounded-full bg-muted" style={{ width: w }} />
          ))}
        </div>
      ) : status === 'error' && all.length === 0 ? (
        <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-sm text-destructive hover:underline">
          <RotateCw className="size-3.5" />
          {t("Couldn't load. Try again")}
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {all.map((name) => {
            const on = value.includes(name);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(name)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  on ? 'border-primary/50 bg-primary/10 font-medium text-primary' : 'border-border text-foreground/80 hover:bg-accent'
                )}
              >
                {on && <Check className="size-3.5" />}
                {capitalize(name)}
              </button>
            );
          })}
          {all.length === 0 && <p className="text-sm text-muted-foreground">{t('Nothing to choose yet.')}</p>}
        </div>
      )}

      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {t(error)}
        </p>
      )}
    </div>
  );
}
