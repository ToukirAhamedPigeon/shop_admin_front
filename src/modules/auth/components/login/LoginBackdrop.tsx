// Layered background behind the login card: base tint, aurora, a faded grid
// that lights up around the cursor, a glow behind the card and meteors.
// Every layer is decorative (aria-hidden, pointer-events: none).
import { useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { Meteors } from "@/components/aceternity/meteors";

export default function LoginBackdrop({ withSeam = false }: { withSeam?: boolean }) {
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);

  // Track the pointer over the whole page; the backdrop itself takes no events.
  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: PointerEvent) => {
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion, x, y]);

  const spotlightMask = useMotionTemplate`radial-gradient(240px circle at ${x}px ${y}px, #000 0%, transparent 100%)`;

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 login-backdrop-base" />
      <div className="login-aurora" />
      <div className="absolute inset-0 login-grid" />
      {!reduceMotion && (
        <motion.div
          className="absolute inset-0 login-grid login-grid-lit"
          style={{ maskImage: spotlightMask, WebkitMaskImage: spotlightMask }}
        />
      )}
      <div className="absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 login-card-halo" />
      <Meteors count={9} />
      {withSeam && <div className="absolute inset-y-0 left-0 w-40 login-seam" />}
    </div>
  );
}
