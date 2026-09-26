// src/components/custom/GlassCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Accepted for API compatibility; all cards now share one flat style. */
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  className,
  hoverEffect = true,
  padding = 'md',
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl bg-card border border-border shadow-xs transition-[box-shadow,border-color] duration-200',
        hoverEffect && 'hover:shadow-sm',
        paddingStyles[padding],
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
