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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <GlassCard variant={variant} hoverEffect padding="md" className={cn("h-full", className)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold mt-2 text-gray-800 dark:text-gray-100">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-500" : "text-red-500"
                  )}
                >
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500">from last month</span>
              </div>
            )}
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
            }}
          >
            {icon}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}