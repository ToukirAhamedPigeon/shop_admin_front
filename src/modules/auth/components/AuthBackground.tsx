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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background">
      {/* Single subtle, static tint — no images, no animation */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,90,180,0.12) 0%, transparent 60%)'
            : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,90,180,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full flex items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
