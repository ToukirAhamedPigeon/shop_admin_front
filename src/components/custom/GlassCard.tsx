// src/components/custom/GlassCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// A subtle top accent, used only to give light semantic distinction between
// variants — no gradients, no transparency washes.
const variantAccent = {
  default: 'before:bg-border',
  primary: 'before:bg-primary/60',
  secondary: 'before:bg-slate-400/60 dark:before:bg-slate-500/60',
  accent: 'before:bg-emerald-500/60 dark:before:bg-emerald-500/50',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  className,
  variant = 'default',
  hoverEffect = true,
  padding = 'md',
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl bg-card border border-border shadow-sm transition-shadow duration-200',
        'before:absolute before:top-0 before:left-4 before:right-4 before:h-[2px] before:rounded-full',
        variantAccent[variant],
        hoverEffect && 'hover:shadow-md',
        paddingStyles[padding],
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
