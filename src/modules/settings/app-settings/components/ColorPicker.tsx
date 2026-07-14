// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\ColorPicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/hooks/useRedux';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  label?: string;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#F472B6', // Rose
  '#34D399', // Mint
  '#60A5FA', // Light Blue
  '#A78BFA', // Light Purple
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  className,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      onChange(color);
      setCustomColor(color);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {label}
        </label>
      )}
      
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {value}
        </span>
        <svg
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen && "transform rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-50 mt-2 p-4 rounded-xl shadow-2xl border min-w-[280px]"
          style={{
            background: isDarkMode
              ? 'rgba(30, 41, 59, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Preset Colors */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg",
                  value === color
                    ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30"
                    : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
            <input
              type="text"
              value={customColor}
              onChange={handleInputChange}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#3B82F6"
            />
            <button
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
              onClick={() => handleColorSelect(customColor)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};