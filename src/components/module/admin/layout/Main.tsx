import { useAppSelector } from '@/hooks/useRedux';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

// Generate random stars with realistic distribution
const generateRandomStars = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    // Random positions with better distribution (avoid edges)
    const x = 2 + Math.random() * 96;
    const y = 2 + Math.random() * 96;
    
    // Random size with more small stars than large ones (realistic)
    const size = Math.random() < 0.7 
      ? 1 + Math.random() * 0.5  // 70% small stars (1-1.5px)
      : Math.random() < 0.2 
        ? 2 + Math.random() * 0.5  // 20% medium stars (2-2.5px)
        : 3 + Math.random() * 1;    // 10% large stars (3-4px)
    
    // Random brightness for realistic twinkling
    const brightness = 0.3 + Math.random() * 0.7;
    
    // Different star colors (white, slightly blue, slightly yellow)
    const colorChoice = Math.random();
    let color;
    if (colorChoice < 0.7) {
      color = `rgba(255, 255, 255, ${brightness})`; // White
    } else if (colorChoice < 0.85) {
      color = `rgba(180, 200, 255, ${brightness})`; // Bluish
    } else {
      color = `rgba(255, 220, 180, ${brightness})`; // Warm/yellowish
    }
    
    // Animation duration variation
    const twinkleDuration = 1.5 + Math.random() * 4;
    const twinkleDelay = Math.random() * 5;
    
    stars.push({
      id: i,
      x,
      y,
      size,
      color,
      opacity: brightness,
      twinkleDuration,
      twinkleDelay,
    });
  }
  return stars;
};

// SVG 3D Objects for Dark Mode (Space theme)
const SpaceObjects = ({ isDarkMode }: { isDarkMode: boolean }) => {
  if (!isDarkMode) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Spaceship */}
      <div className="floating-obj absolute" data-depth="0.3" style={{ top: '12%', left: '8%', opacity: 0.2 }}>
        <svg width="90" height="54" viewBox="0 0 90 54" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="45" cy="27" rx="44" ry="14" fill="url(#shipBody)" />
          <ellipse cx="45" cy="22" rx="20" ry="10" fill="url(#cockpit)" />
          <ellipse cx="45" cy="22" rx="16" ry="7" fill="rgba(100,180,255,0.3)" />
          <rect x="8" y="30" width="14" height="5" rx="2.5" fill="rgba(120,160,255,0.5)" />
          <rect x="68" y="30" width="14" height="5" rx="2.5" fill="rgba(120,160,255,0.5)" />
          <ellipse cx="45" cy="38" rx="10" ry="4" fill="rgba(255,120,60,0.4)" />
          <defs>
            <linearGradient id="shipBody" x1="0" y1="0" x2="90" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a0b8e0" /><stop offset="1" stopColor="#4a6fa5" />
            </linearGradient>
            <linearGradient id="cockpit" x1="25" y1="12" x2="65" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c8e0ff" /><stop offset="1" stopColor="#5a8acc" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Astronaut */}
      <div className="floating-obj absolute" data-depth="0.5" style={{ top: '55%', right: '7%', opacity: 0.18 }}>
        <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="30" cy="20" rx="16" ry="18" fill="url(#helmet)" />
          <ellipse cx="30" cy="20" rx="11" ry="12" fill="rgba(120,180,255,0.25)" />
          <rect x="14" y="34" width="32" height="28" rx="10" fill="url(#suit)" />
          <rect x="6" y="36" width="10" height="20" rx="5" fill="url(#arm)" />
          <rect x="44" y="36" width="10" height="20" rx="5" fill="url(#arm)" />
          <rect x="18" y="60" width="10" height="18" rx="5" fill="url(#leg)" />
          <rect x="32" y="60" width="10" height="18" rx="5" fill="url(#leg)" />
          <rect x="22" y="38" width="16" height="10" rx="3" fill="rgba(160,200,255,0.3)" />
          <defs>
            <radialGradient id="helmet" cx="50%" cy="40%" r="55%">
              <stop stopColor="#d8ecff" /><stop offset="1" stopColor="#7aace0" />
            </radialGradient>
            <linearGradient id="suit" x1="14" y1="34" x2="46" y2="62" gradientUnits="userSpaceOnUse">
              <stop stopColor="#b0c8e8" /><stop offset="1" stopColor="#5a80b0" />
            </linearGradient>
            <linearGradient id="arm" x1="0" y1="0" x2="10" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a0b8d8" /><stop offset="1" stopColor="#5070a0" />
            </linearGradient>
            <linearGradient id="leg" x1="0" y1="0" x2="10" y2="18" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9ab0d0" /><stop offset="1" stopColor="#4a6890" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Planet */}
      <div className="floating-obj absolute" data-depth="0.2" style={{ top: '20%', right: '15%', opacity: 0.15 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="38" fill="url(#planet)" />
          <ellipse cx="50" cy="50" rx="60" ry="14" stroke="rgba(180,160,255,0.4)" strokeWidth="3" fill="none" />
          <ellipse cx="50" cy="50" rx="55" ry="11" stroke="rgba(180,160,255,0.2)" strokeWidth="1.5" fill="none" />
          <circle cx="38" cy="38" r="8" fill="rgba(255,255,255,0.05)" />
          <defs>
            <radialGradient id="planet" cx="35%" cy="35%" r="65%">
              <stop stopColor="#b8a8e8" /><stop offset="0.6" stopColor="#7060b0" /><stop offset="1" stopColor="#3a2a70" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      
      {/* Small satellite */}
      <div className="floating-obj absolute" data-depth="0.7" style={{ bottom: '18%', left: '15%', opacity: 0.16 }}>
        <svg width="55" height="30" viewBox="0 0 55 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="10" width="15" height="10" rx="3" fill="url(#satBody)" />
          <rect x="0" y="12" width="18" height="6" rx="2" fill="url(#panel)" />
          <rect x="37" y="12" width="18" height="6" rx="2" fill="url(#panel)" />
          <rect x="26" y="6" width="3" height="18" rx="1.5" fill="#a0b8d0" />
          <defs>
            <linearGradient id="satBody" x1="20" y1="10" x2="35" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c0d0e8" /><stop offset="1" stopColor="#6080a8" />
            </linearGradient>
            <linearGradient id="panel" x1="0" y1="0" x2="18" y2="6" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4060b0" /><stop offset="1" stopColor="#203080" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

// SVG 3D Objects for Light Mode (Underwater/Sky theme)
const LightObjects = ({ isDarkMode }: { isDarkMode: boolean }) => {
  if (isDarkMode) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Hot air balloon */}
      <div className="floating-obj absolute" data-depth="0.3" style={{ top: '8%', right: '12%', opacity: 0.25 }}>
        <svg width="70" height="95" viewBox="0 0 70 95" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="35" cy="38" rx="30" ry="35" fill="url(#balloon)" />
          <path d="M20 68 Q35 74 50 68" stroke="rgba(180,100,60,0.5)" strokeWidth="1.5" fill="none" />
          <path d="M22 60 Q35 66 48 60" stroke="rgba(180,100,60,0.4)" strokeWidth="1" fill="none" />
          <rect x="27" y="70" width="16" height="10" rx="3" fill="url(#basket)" />
          <line x1="28" y1="70" x2="22" y2="68" stroke="rgba(140,80,40,0.5)" strokeWidth="1" />
          <line x1="42" y1="70" x2="48" y2="68" stroke="rgba(140,80,40,0.5)" strokeWidth="1" />
          <defs>
            <radialGradient id="balloon" cx="40%" cy="30%" r="65%">
              <stop stopColor="#ffd0a0" /><stop offset="0.5" stopColor="#f08060" /><stop offset="1" stopColor="#e05040" />
            </radialGradient>
            <linearGradient id="basket" x1="27" y1="70" x2="43" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c8a070" /><stop offset="1" stopColor="#8a6040" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Cloud 1 */}
      <div className="floating-obj absolute" data-depth="0.2" style={{ top: '15%', left: '5%', opacity: 0.4 }}>
        <svg width="130" height="55" viewBox="0 0 130 55" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="65" cy="38" rx="60" ry="16" fill="white" fillOpacity="0.95" />
          <ellipse cx="45" cy="30" rx="28" ry="20" fill="white" fillOpacity="0.9" />
          <ellipse cx="75" cy="26" rx="32" ry="24" fill="white" fillOpacity="0.95" />
          <ellipse cx="98" cy="33" rx="22" ry="16" fill="white" fillOpacity="0.85" />
        </svg>
      </div>
      
      {/* Cloud 2 smaller */}
      <div className="floating-obj absolute" data-depth="0.15" style={{ top: '28%', right: '3%', opacity: 0.32 }}>
        <svg width="90" height="38" viewBox="0 0 90 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="45" cy="26" rx="40" ry="12" fill="white" fillOpacity="0.9" />
          <ellipse cx="30" cy="20" rx="20" ry="15" fill="white" fillOpacity="0.85" />
          <ellipse cx="55" cy="17" rx="22" ry="17" fill="white" fillOpacity="0.9" />
        </svg>
      </div>
      
      {/* Bird flock */}
      <div className="floating-obj absolute" data-depth="0.4" style={{ top: '38%', left: '10%', opacity: 0.22 }}>
        <svg width="80" height="30" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 15 Q12 8 20 15" stroke="#4a6080" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M28 10 Q35 3 42 10" stroke="#4a6080" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M50 18 Q57 11 64 18" stroke="#4a6080" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M15 22 Q20 17 26 22" stroke="#4a6080" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M60 8 Q65 3 70 8" stroke="#4a6080" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      
      {/* Butterfly */}
      <div className="floating-obj absolute" data-depth="0.6" style={{ bottom: '20%', right: '10%', opacity: 0.2 }}>
        <svg width="50" height="40" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="14" cy="16" rx="13" ry="10" fill="url(#wing1)" transform="rotate(-15 14 16)" />
          <ellipse cx="36" cy="16" rx="13" ry="10" fill="url(#wing2)" transform="rotate(15 36 16)" />
          <ellipse cx="14" cy="28" rx="9" ry="7" fill="url(#wing1)" transform="rotate(10 14 28)" />
          <ellipse cx="36" cy="28" rx="9" ry="7" fill="url(#wing2)" transform="rotate(-10 36 28)" />
          <rect x="24" y="10" width="2" height="20" rx="1" fill="#7a5030" />
          <defs>
            <linearGradient id="wing1" x1="0" y1="0" x2="28" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f0a060" /><stop offset="1" stopColor="#e06030" />
            </linearGradient>
            <linearGradient id="wing2" x1="50" y1="0" x2="22" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f0a060" /><stop offset="1" stopColor="#c05020" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default function Main({ children }: { children: React.ReactNode }) {
  const sidebar = useAppSelector((state) => state.sidebar);
  const isCollapsed = !sidebar.isVisible;
  const containerRef = useRef<HTMLElement>(null);
  const mouseLightRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  
  // Generate random stars
  const stars = generateRandomStars(120);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Floating animation for all objects
  useEffect(() => {
    const objs = document.querySelectorAll('.floating-obj');
    objs.forEach((el, i) => {
      const delay = i * 0.6;
      const duration = 12 + (i % 5) * 4;
      gsap.to(el, {
        y: `${-18 - (i % 4) * 8}`,
        x: `${(i % 3 - 1) * 10}`,
        rotation: (i % 2 === 0 ? 1 : -1) * (2 + (i % 3)),
        duration,
        delay,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    // Stars twinkling - individual animation for each star
    const stars = document.querySelectorAll('.star-obj');
    stars.forEach((el) => {
      const randomDelay = Math.random() * 5;
      const randomDuration = 1 + Math.random() * 4;
      gsap.to(el, {
        opacity: 'random(0.2, 0.9)',
        scale: 'random(0.7, 1.3)',
        duration: randomDuration,
        delay: randomDelay,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    // Particles float
    const particles = document.querySelectorAll('.particle-obj');
    particles.forEach((el, i) => {
      gsap.to(el, {
        y: `${-15 - i * 3}`,
        x: `${(i % 3 - 1) * 8}`,
        opacity: 0.2 + (i % 3) * 0.2,
        duration: 8 + i * 1.5,
        delay: i * 0.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    // Content fade-in
    if (containerRef.current) {
      const content = containerRef.current.querySelector('.content-container');
      if (content) {
        gsap.fromTo(content, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' });
      }
    }
  }, [isDarkMode]);

  // Smooth parallax mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      // Soft mouse light
      if (mouseLightRef.current) {
        gsap.to(mouseLightRef.current, {
          x: mouseRef.current.x - 200,
          y: mouseRef.current.y - 200,
          duration: 1.6,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      }

      // Parallax for floating objects
      const objs = document.querySelectorAll<HTMLElement>('.floating-obj');
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      objs.forEach((el) => {
        const depth = parseFloat(el.getAttribute('data-depth') || '0.2');
        const dx = (mouseRef.current.x - cx) * depth * 0.04;
        const dy = (mouseRef.current.y - cy) * depth * 0.04;
        gsap.to(el, {
          x: `+=${dx}`,
          y: `+=${dy}`,
          duration: 2.5,
          ease: 'power1.out',
          overwrite: false,
        });
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove]);

  return (
    <main
      ref={containerRef}
      className={`relative flex-grow transition-all duration-500 ease-out overflow-hidden ${isCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      {/* === DARK MODE: Deep Space === */}
      {isDarkMode && (
        <div className="absolute inset-0 transition-opacity duration-700">
          {/* Deep space base */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#050510]" />
          
          {/* Nebula gradients */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 70% 40% at 20% 30%, rgba(60,40,120,0.15) 0%, transparent 60%),
                radial-gradient(ellipse 50% 35% at 85% 70%, rgba(20,60,140,0.12) 0%, transparent 55%),
                radial-gradient(ellipse 40% 25% at 60% 20%, rgba(100,30,100,0.08) 0%, transparent 50%)
              `,
            }}
          />
          
          {/* Milky Way band effect */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(125deg, 
                transparent 20%, 
                rgba(180,160,220,0.08) 35%, 
                rgba(200,180,240,0.12) 50%, 
                rgba(180,160,220,0.08) 65%, 
                transparent 80%
              )`,
            }}
          />
          
          {/* Randomly scattered stars - rendered with proper distribution */}
          <div className="absolute inset-0">
            {stars.map((star) => (
              <div
                key={star.id}
                className="star-obj absolute rounded-full"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size,
                  height: star.size,
                  backgroundColor: star.color,
                  opacity: star.opacity,
                  boxShadow: star.size > 2 ? `0 0 ${star.size * 1.5}px ${star.color}` : 'none',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* === LIGHT MODE: Airy Day Sky === */}
      {!isDarkMode && (
        <div className="absolute inset-0 transition-opacity duration-700">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, #d4e8fc 0%, #e8f4ff 25%, #f5f8fc 50%, #fef8f0 75%, #fff5ec 100%)`,
            }}
          />
          {/* Soft sky gradient overlay */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: `
                radial-gradient(ellipse 60% 35% at 15% 10%, rgba(180,220,255,0.2) 0%, transparent 60%),
                radial-gradient(ellipse 50% 30% at 85% 15%, rgba(255,230,190,0.18) 0%, transparent 55%)
              `,
            }}
          />
          {/* Subtle sun glow */}
          <div
            className="absolute opacity-30"
            style={{
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              top: '10%',
              right: '5%',
              background: 'radial-gradient(circle, rgba(255,220,150,0.3) 0%, transparent 70%)',
            }}
          />
        </div>
      )}

      {/* 3D Floating Objects */}
      <SpaceObjects isDarkMode={isDarkMode} />
      <LightObjects isDarkMode={isDarkMode} />

      {/* Mouse soft light */}
      <div
        ref={mouseLightRef}
        className="absolute pointer-events-none"
        style={{
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(100,150,255,0.05) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,245,200,0.12) 0%, transparent 65%)',
          willChange: 'transform',
        }}
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(80,120,200,0.03)'} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Content */}
      <div className="content-container relative z-10 p-4 md:p-6">
        {children}
      </div>
    </main>
  );
}