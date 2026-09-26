// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\SettingsSidebar.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/useTranslations';
import { CATEGORY_CONFIG, CATEGORY_ORDER } from '../config/categories';
import { 
  PaintBucket, 
  Tag, 
  Settings,
  type LucideIcon 
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  PaintBucket,
  Tag,
  Settings
};

interface SettingsSidebarProps {
  activeCategory: string;
  onSelect: (category: string) => void;
  isDeveloper: boolean;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeCategory,
  onSelect,
  isDeveloper
}) => {
  const { t } = useTranslations();

  // Filter categories based on user role
  const visibleCategories = CATEGORY_ORDER.filter((categoryKey) => {
    // If it's Branding, only show for Developer users
    if (categoryKey === 'Branding') {
      return isDeveloper === true;
    }
    // Theme and General are always visible
    return true;
  });

  return (
    <div className="w-60 border-r border-border p-3 space-y-0.5">
      <div className="px-3 pt-1 pb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('Categories')}
        </h3>
      </div>
      
      {visibleCategories.map((categoryKey) => {
        const config = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG];
        const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP];
        const isActive = activeCategory === categoryKey;

        return (
          <button
            key={categoryKey}
            onClick={() => onSelect(categoryKey)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 text-left whitespace-nowrap cursor-pointer",
              isActive
                ? "bg-accent text-primary font-medium"
                : "hover:bg-accent text-foreground/80 hover:text-foreground"
            )}
          >
            {Icon && (
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
            )}
            <span className="truncate">{t(config.displayName)}</span>
          </button>
        );
      })}
    </div>
  );
};