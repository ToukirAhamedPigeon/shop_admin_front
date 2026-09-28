// src/modules/settings/app-settings/components/SettingsSidebar.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/useTranslations';
import { CATEGORY_CONFIG, CATEGORY_ORDER } from '../config/categories';
import { Palette, Tag, SlidersHorizontal, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  PaintBucket: Palette,
  Tag,
  Settings: SlidersHorizontal,
};

interface SettingsSidebarProps {
  activeCategory: string;
  onSelect: (category: string) => void;
  isDeveloper: boolean;
  /** Category with unsaved edits, marked with a dot. */
  dirtyCategory?: string | null;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeCategory, onSelect, isDeveloper, dirtyCategory }) => {
  const { t } = useTranslations();

  // Branding is global and only Developer users may change it.
  const visibleCategories = CATEGORY_ORDER.filter((key) => key !== 'Branding' || isDeveloper === true);

  return (
    // Phones: a row of chips above the content. md+: a vertical list with descriptions.
    <nav
      aria-label={t('Settings categories')}
      className="flex w-full gap-1.5 overflow-x-auto border-b border-border p-2 md:block md:h-full md:w-64 md:space-y-1 md:overflow-y-auto md:border-b-0 md:border-r md:p-3"
    >
      <p className="hidden px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:block">{t('Categories')}</p>
      {visibleCategories.map((key) => {
        const config = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG];
        const Icon = ICON_MAP[config.icon] ?? SlidersHorizontal;
        const active = activeCategory === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring md:w-full md:items-start md:py-2.5',
              active ? 'bg-primary/10 text-foreground' : 'text-foreground/80 hover:bg-accent hover:text-foreground'
            )}
          >
            {active && <span aria-hidden className="absolute inset-y-2 left-0 hidden w-[3px] rounded-full bg-primary md:block" />}
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md md:mt-0.5',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className={cn('flex items-center gap-1.5 whitespace-nowrap', active && 'font-medium')}>
                {t(config.displayName)}
                {dirtyCategory === key && <span className="size-1.5 rounded-full bg-warning" aria-label={t('Unsaved changes')} />}
              </span>
              <span className="mt-0.5 hidden text-xs leading-snug text-muted-foreground md:block">{t(config.description)}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
};
