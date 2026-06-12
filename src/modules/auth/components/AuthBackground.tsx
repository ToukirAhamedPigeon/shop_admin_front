/**
 * AuthBackground.tsx
 * Shared premium animated background for all auth pages.
 * Usage: wrap your auth page content with <AuthBackground theme={theme}>...</AuthBackground>
 */
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

interface AuthBackgroundProps {
  theme: string;
  children: React.ReactNode;
}

export default function AuthBackground({ theme, children }: AuthBackgroundProps) {
  const isDark = theme === 'dark';
  const orbRef1 = useRef<HTMLDivElement>(null);
  const orbRef2 = useRef<HTMLDivElement>(null);
  const orbRef3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orbRef1.current) {
      gsap.to(orbRef1.current, { x: 80, y: -60, duration: 18, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    if (orbRef2.current) {
      gsap.to(orbRef2.current, { x: -60, y: 80, duration: 22, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2 });
    }
    if (orbRef3.current) {
      gsap.to(orbRef3.current, { scale: 1.15, x: 30, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 4 });
    }
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: isDark ? "url('/login-bg-dark.jpg')" : "url('/login-bg.jpg')",
        }}
      />

      {/* Premium overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(5, 8, 25, 0.95) 0%, rgba(10, 18, 48, 0.92) 50%, rgba(8, 12, 36, 0.96) 100%)'
            : 'linear-gradient(135deg, rgba(56, 189, 248, 0.85) 0%, rgba(139, 92, 246, 0.75) 50%, rgba(249, 115, 22, 0.80) 100%)',
        }}
      />

      {/* Animated orbs */}
      <div ref={orbRef1}
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 520, height: 520,
          top: '-180px', left: '-120px',
          background: isDark
            ? 'radial-gradient(circle, rgba(80, 40, 160, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56, 189, 248, 0.20) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div ref={orbRef2}
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 400, height: 400,
          bottom: '-130px', right: '-80px',
          background: isDark
            ? 'radial-gradient(circle, rgba(30, 60, 160, 0.22) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />
      <div ref={orbRef3}
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 300, height: 300,
          top: '30%', right: '15%',
          background: isDark
            ? 'radial-gradient(circle, rgba(60, 100, 200, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, transparent 70%)',
          filter: 'blur(32px)',
        }}
      />

      {/* Particle field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isDark
          ? [...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 1,
                  height: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 1,
                  top: `${3 + (i * 41) % 94}%`,
                  left: `${2 + (i * 67) % 96}%`,
                  opacity: 0.3 + (i % 5) * 0.12,
                  boxShadow: i % 5 === 0 ? '0 0 6px 2px rgba(180,210,255,0.35)' : 'none',
                }}
                animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
              />
            ))
          : [...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 2 + (i % 3),
                  height: 2 + (i % 3),
                  top: `${5 + (i * 43) % 88}%`,
                  left: `${4 + (i * 71) % 92}%`,
                  background: i % 3 === 0
                    ? 'rgba(255, 220, 160, 0.6)'
                    : i % 2 === 0
                    ? 'rgba(160, 210, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.45)',
                  opacity: 0.3 + (i % 4) * 0.12,
                }}
                animate={{ y: [-6, 6, -6], opacity: [0.2, 0.7, 0.2] }}
                transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
              />
            ))
        }
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}