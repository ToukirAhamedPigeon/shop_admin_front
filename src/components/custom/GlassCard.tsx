// src/components/custom/GlassCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/hooks/useRedux';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: {
    light: 'border-white/30',
    dark: 'border-white/10',
    gradient: 'linear-gradient(135deg, rgba(100,120,255,0.08), rgba(180,100,255,0.05))',
  },
  primary: {
    light: 'border-blue-300/50',
    dark: 'border-blue-500/20',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))',
  },
  secondary: {
    light: 'border-purple-300/50',
    dark: 'border-purple-500/20',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(124,58,237,0.05))',
  },
  accent: {
    light: 'border-emerald-300/50',
    dark: 'border-emerald-500/20',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
  },
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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative rounded-2xl backdrop-blur-xl transition-all duration-300",
        hoverEffect && "hover:scale-[1.02] hover:shadow-2xl",
        paddingStyles[padding],
        className
      )}
      style={{
        background: isDarkMode
          ? 'rgba(17, 24, 39, 0.4)'
          : 'rgba(255, 255, 255, 0.55)',
        border: `1px solid ${isDarkMode ? styles.dark : styles.light}`,
        boxShadow: isDarkMode
          ? '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      {/* Animated gradient border overlay */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{
          background: styles.gradient,
        }}
      />
      
      {/* Colored accent line at top */}
      <div
        className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${isDarkMode ? '#6366f1' : '#818cf8'}, ${isDarkMode ? '#a855f7' : '#c084fc'}, transparent)`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}