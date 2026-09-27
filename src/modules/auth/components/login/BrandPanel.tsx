// Left-hand brand panel for the login page (large screens only): a lazily
// loaded Three.js scene behind a GSAP-revealed headline and feature list.
import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ShieldCheck, Activity, Languages } from "lucide-react";
import { TextGenerate } from "@/components/aceternity/text-generate";
import { useTranslations } from "@/hooks/useTranslations";

gsap.registerPlugin(SplitText);

const NeuralScene = lazy(() => import("./NeuralScene"));

export default function BrandPanel() {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  // The 3D scene mounts after the intro so loading three.js and compiling its
  // shaders can't stall the headline animation on slower machines.
  const [sceneReady, setSceneReady] = useState(false);

  const features = [
    { icon: ShieldCheck, label: t("login.feature.secure", "Role-based, secure access") },
    { icon: Activity, label: t("login.feature.realtime", "Real-time operational insight") },
    { icon: Languages, label: t("login.feature.i18n", "Multi-language by design") },
  ];

  useLayoutEffect(() => {
    if (reduceMotion || !headline.current) {
      setSceneReady(true);
      return;
    }
    const ctx = gsap.context(() => {
      const split = SplitText.create(headline.current!, { type: "lines,words", mask: "lines" });
      // Give line masks room for descenders (g, y, p) without shifting layout.
      split.masks.forEach((m) => {
        (m as HTMLElement).style.paddingBottom = "0.14em";
        (m as HTMLElement).style.marginBottom = "-0.14em";
      });
      gsap
        .timeline({ defaults: { ease: "power3.out" }, onComplete: () => setSceneReady(true) })
        .from("[data-brand-logo]", { autoAlpha: 0, y: 12, duration: 0.6 })
        .from(split.words, { yPercent: 110, duration: 0.9, stagger: 0.06 }, "-=0.3")
        .from("[data-brand-feature]", { autoAlpha: 0, x: -14, duration: 0.5, stagger: 0.1 }, "-=0.2");
    }, root);
    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <div
      ref={root}
      className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white login-brand-panel"
    >
      {/* 3D scene */}
      {sceneReady && (
        <motion.div
          aria-hidden
          className="absolute inset-0 translate-x-[18%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.4, ease: "easeOut" }}
        >
          <Suspense fallback={null}>
            <NeuralScene animate={!reduceMotion} />
          </Suspense>
        </motion.div>
      )}
      {/* Legibility wash over the scene, strongest behind the copy. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 login-brand-wash" />

      <div data-brand-logo className="relative flex items-center gap-3">
        <img src="/logo.png" alt="" width={36} height={36} />
        <span className="text-lg font-semibold tracking-tight">{t("common.appName", "AIMS")}</span>
      </div>

      <div className="relative max-w-md">
        <h2 ref={headline} className="text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight">
          {t("login.headline", "Run your business with intelligence.")}
        </h2>
        <TextGenerate
          text={t("login.subheadline", "One secure workspace for users, roles, mail and settings, powered by AI.")}
          delay={reduceMotion ? 0 : 0.9}
          className="mt-5 text-base leading-relaxed text-indigo-100/75"
        />

        <ul className="mt-10 space-y-3">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} data-brand-feature className="flex items-center gap-3 text-sm text-indigo-50/90">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/10 backdrop-blur">
                <Icon className="size-4 text-indigo-200" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-indigo-200/50">
        © {new Date().getFullYear()} {t("common.appName", "AIMS")} · AI Powered Management System
      </p>
    </div>
  );
}
