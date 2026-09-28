// Shared layout for every page outside the admin layout (login, password
// reset, email verification, error pages).
//
// One neural-network scene spans the whole page; the content column sees it
// through progressive frosted glass. The shell is a layout route, so the
// scene, brand copy and intro persist while the user moves between public
// pages. Only the card in the content column transitions.
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import AuthHeader from "@/modules/auth/components/AuthHeader";
import BrandPanel from "@/modules/auth/components/login/BrandPanel";
import { cn } from "@/lib/utils";
import { readLoginBackground } from "@/lib/userTheme";

// Full-screen neural-network sphere; its own chunk so three.js stays out of the main bundle.
const NeuralScene = lazy(() => import("@/modules/auth/components/login/NeuralScene"));

// Backdrop blur over a live WebGL scene is re-computed every frame. Skip it on
// devices that are likely to struggle (few cores, little memory, data saver).
function prefersLiteGlass() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4 ||
    nav.connection?.saveData === true
  );
}

// Progressive blur bands: each layer blurs only its own strip (plus overlap),
// so no single heavy blur covers the whole column except the final one.
const GLASS_BANDS = [
  { blur: "4px", left: "0%", fadeIn: "0%", solid: "40%" },
  { blur: "10px", left: "10%", fadeIn: "0%", solid: "40%" },
  { blur: "20px", left: "20%", fadeIn: "0%", solid: "45%" },
  { blur: "36px", left: "30%", fadeIn: "0%", solid: "25%" },
];

export default function AuthShell() {
  const [loginBg] = useState(readLoginBackground);
  const location = useLocation();
  const outlet = useOutlet();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduceMotion = useReducedMotion();
  const [sceneReady, setSceneReady] = useState(false);
  const [liteGlass, setLiteGlass] = useState(prefersLiteGlass);

  // Adaptive quality: once the 3D scene is on screen, sample the real frame rate
  // and fall back to the tint-only glass if the blur makes the page stutter.
  useEffect(() => {
    if (!isDesktop || !sceneReady || liteGlass) return;
    let raf = 0;
    let frames = 0;
    let start = 0;
    const warmup = window.setTimeout(() => {
      start = performance.now();
      const tick = (now: number) => {
        frames++;
        if (now - start < 1500) {
          raf = requestAnimationFrame(tick);
        } else if ((frames * 1000) / (now - start) < 40) {
          setLiteGlass(true);
        }
      };
      raf = requestAnimationFrame(tick);
    }, 2000);
    return () => {
      window.clearTimeout(warmup);
      cancelAnimationFrame(raf);
    };
  }, [isDesktop, sceneReady, liteGlass]);

  return (
    <div className="relative min-h-dvh overflow-hidden login-stage">
      {/* The sign-in background chosen in App Settings (last person on this
          browser), dimmed so the scene and the form stay readable. */}
      {loginBg && (
        <div
          aria-hidden
          className="fixed inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(oklch(0.13 0.03 272 / 0.78), oklch(0.13 0.03 272 / 0.88)), url(${JSON.stringify(loginBg)})`,
          }}
        />
      )}
      {/* One scene spans the whole page, so the brand side and the content side
          are the same picture; the content side just sees it through glass. */}
      {isDesktop && sceneReady && (
        <motion.div
          aria-hidden
          className="fixed inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.6, ease: "easeOut" }}
        >
          <Suspense fallback={null}>
            <NeuralScene animate={!reduceMotion} />
          </Suspense>
        </motion.div>
      )}

      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[1.15fr_1fr]">
        {isDesktop && <BrandPanel onIntroComplete={() => setSceneReady(true)} />}

        <main className="relative flex items-center justify-center px-4 py-20">
          {/* Progressive frosted glass: starts clear left of the column and
              thickens toward the content, so the sphere stays faintly visible. */}
          <div
            aria-hidden
            className={cn(
              "login-glass pointer-events-none absolute inset-y-0 right-0 left-0 lg:-left-40",
              (liteGlass || !isDesktop) && "login-glass--lite"
            )}
          >
            {isDesktop &&
              !liteGlass &&
              GLASS_BANDS.map((b) => (
                <div
                  key={b.blur}
                  className="login-glass-layer"
                  style={{
                    left: b.left,
                    ["--blur" as string]: b.blur,
                    ["--in" as string]: b.fadeIn,
                    ["--solid" as string]: b.solid,
                  }}
                />
              ))}
            <div className="login-glass-tint" />
          </div>

          {/* The header always sits on the dark glass, so scope it to dark tokens. */}
          <div className="dark">
            <AuthHeader />
          </div>

          {/* Only the page's card transitions between routes. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="relative flex w-full justify-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
