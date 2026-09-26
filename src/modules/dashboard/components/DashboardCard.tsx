// src/modules/dashboard/components/DashboardCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/custom/GlassCard';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  delay?: number;
}

export default function DashboardCard({
  title,
  value,
  icon,
  trend,
  className,
  variant = 'default',
  delay = 0,
}: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard variant={variant} hoverEffect padding="md" className={cn("h-full p-5", className)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-[28px] leading-none font-semibold tracking-tight tabular-nums mt-3 text-foreground">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1.5 mt-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
                    trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}
                >
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground">from last month</span>
              </div>
            )}
          </div>
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-[18px]">
            {icon}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}