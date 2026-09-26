/**
 * AuthBackground.tsx
 * Simple, static background shared by all auth pages — a flat theme
 * background with a single subtle radial tint, no photos or looping motion.
 */
import React from 'react';

interface AuthBackgroundProps {
  theme: string;
  children: React.ReactNode;
}

export default function AuthBackground({ theme, children }: AuthBackgroundProps) {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-background">
      {/* Fine dot grid, faded toward the edges — static, theme-aware. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none text-foreground"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          opacity: isDark ? 0.07 : 0.06,
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, #000 30%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 py-16">
        {children}
      </div>
    </div>
  );
}
