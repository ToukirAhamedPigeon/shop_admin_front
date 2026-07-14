// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\SettingsSidebar.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppSelector } from '@/hooks/useRedux';
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
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeCategory,
  onSelect
}) => {
  const { t } = useTranslations();
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {t('Categories')}
        </h3>
      </div>
      
      {CATEGORY_ORDER.map((categoryKey) => {
        const config = CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG];
        const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP];
        const isActive = activeCategory === categoryKey;

        return (
          <button
            key={categoryKey}
            onClick={() => onSelect(categoryKey)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
              isActive
                ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-500/30 dark:to-indigo-500/30 text-blue-700 dark:text-blue-300 font-medium shadow-md"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            {Icon && (
              <Icon className={cn(
                "w-5 h-5",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
              )} />
            )}
            <span>{t(config.displayName)}</span>
            {isActive && (
              <div className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};