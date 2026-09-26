// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\ColorPicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
        <label className="block text-sm font-medium text-foreground/80 mb-2">
          {label}
        </label>
      )}
      
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="w-10 h-10 rounded-lg border-2 border-input shadow-sm hover:shadow-md transition-all duration-200"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-mono text-muted-foreground">
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
          className="absolute z-50 mt-2 p-4 rounded-xl shadow-md border border-border bg-popover min-w-[280px]"
        >
          {/* Preset Colors */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 transition-[box-shadow,border-color] duration-150 hover:ring-2 hover:ring-ring",
                  value === color
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
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
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-input bg-card text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="#3B82F6"
            />
            <button
              className="px-3 py-1.5 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
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