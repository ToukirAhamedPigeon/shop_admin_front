// Left-hand brand copy for the login page (large screens only): a GSAP-revealed
// headline at the top and the feature list at the bottom, leaving the middle
// clear for the full-screen brain scene rendered by LoginPage.
import { useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ShieldCheck, Activity, Languages } from "lucide-react";
import { TextGenerate } from "@/components/aceternity/text-generate";
import { useTranslations } from "@/hooks/useTranslations";

gsap.registerPlugin(SplitText);

export default function BrandPanel({ onIntroComplete }: { onIntroComplete?: () => void }) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  // LoginPage mounts the 3D scene only after this intro, so loading three.js
  // and compiling shaders can't stall the headline animation.
  const onDone = useRef(onIntroComplete);
  onDone.current = onIntroComplete;

  const features = [
    { icon: ShieldCheck, label: t("login.feature.secure", "Role-based, secure access") },
    { icon: Activity, label: t("login.feature.realtime", "Real-time operational insight") },
    { icon: Languages, label: t("login.feature.i18n", "Multi-language by design") },
  ];

  useLayoutEffect(() => {
    if (reduceMotion || !headline.current) {
      onDone.current?.();
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
        .timeline({ defaults: { ease: "power3.out" }, onComplete: () => onDone.current?.() })
        .from("[data-brand-logo]", { autoAlpha: 0, y: 12, duration: 0.6 })
        .from(split.words, { yPercent: 110, duration: 0.9, stagger: 0.06 }, "-=0.3")
        .from("[data-brand-feature]", { autoAlpha: 0, x: -14, duration: 0.5, stagger: 0.1 }, "-=0.2");
    }, root);
    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <div
      ref={root}
      className="relative hidden lg:flex flex-col justify-between p-12 text-white pointer-events-none select-none"
    >
      <div>
        <div data-brand-logo className="flex items-center gap-3">
          <img src="/logo.png" alt="" width={36} height={36} />
          <span className="text-lg font-semibold tracking-tight">{t("common.appName", "AIMS")}</span>
        </div>

        <div className="mt-12 max-w-md">
          <h2 ref={headline} className="text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight login-brand-text">
            {t("login.headline", "Run your business with intelligence.")}
          </h2>
          <TextGenerate
            text={t("login.subheadline", "One secure workspace for users, roles, mail and settings, powered by AI.")}
            delay={reduceMotion ? 0 : 0.9}
            className="mt-4 max-w-sm text-base leading-relaxed text-indigo-100/80 login-brand-text"
          />
        </div>
      </div>

      <div>
        <ul className="flex flex-wrap gap-2.5">
          {features.map(({ icon: Icon, label }) => (
            <li
              key={label}
              data-brand-feature
              className="flex items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-3.5 text-xs text-indigo-50/90 ring-1 ring-white/10 backdrop-blur-md"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-white/10">
                <Icon className="size-3.5 text-indigo-200" />
              </span>
              {label}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-indigo-200/50">
          © {new Date().getFullYear()} {t("common.appName", "AIMS")} · AI Powered Management System
        </p>
      </div>
    </div>
  );
}
