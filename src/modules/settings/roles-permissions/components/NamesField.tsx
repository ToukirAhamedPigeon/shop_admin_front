// src/modules/settings/roles-permissions/components/NamesField.tsx
// "Admin=Editor=Viewer" creates three roles (or permissions) at once. This
// input shows what will be created as you type.
import type { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import { BasicInput } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';
import { splitNames } from './permissionMeta';

interface Props {
  id: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  model: string;
  value: string;
  noun: string;
  /** Extra line under each name, e.g. how a permission name is read. */
  describe?: (name: string) => string | undefined;
}

export default function NamesField({ id, label, placeholder, register, error, model, value, noun, describe }: Props) {
  const { t } = useTranslations();
  const names = splitNames(value);
  return (
    <div className="space-y-2">
      <BasicInput id={id} label={label} isRequired placeholder={placeholder} register={register} error={error} model={model} />
      <p className="text-xs text-muted-foreground">
        {t('Add several at once by separating names with')} <kbd className="rounded border border-border bg-muted px-1 font-mono">=</kbd>
      </p>
      {names.length > 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {names.length === 1 ? `${t('Will create')} 1 ${t(noun)}` : `${t('Will create')} ${names.length} ${t(noun + 's')}`}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {names.map((name) => {
              const note = describe?.(name);
              return (
                <li key={name} className={cn('rounded-md border border-border bg-card px-2 py-1 text-xs', note && 'leading-tight')}>
                  <span className="font-medium text-foreground">{name}</span>
                  {note && <span className="block text-[11px] text-muted-foreground">{note}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
