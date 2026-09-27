import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, useAnimationControls, useReducedMotion, type Variants } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, User, Lock } from "lucide-react";
import type { RootState } from "@/redux/store";
import { useTranslations } from "@/hooks/useTranslations";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpotlightCard } from "@/components/aceternity/spotlight-card";
import { GlowField } from "@/components/aceternity/glow-field";
import { dispatchLoginUser, dispatchShowLoader, dispatchHideLoader, dispatchShowToast } from "@/lib/dispatch";
import AuthHeader from "@/modules/auth/components/AuthHeader";
import BrandPanel from "@/modules/auth/components/login/BrandPanel";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(6, "Password too short"),
});
type LoginForm = z.infer<typeof loginSchema>;

// Full-screen neural-network sphere; its own chunk so three.js stays out of the main bundle.
const NeuralScene = lazy(() => import("@/modules/auth/components/login/NeuralScene"));

const EASE = [0.22, 1, 0.36, 1] as const;

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
  { blur: "4px", left: "0%", fadeIn: "0%", solid: "40%", fadeOut: "100%" },
  { blur: "10px", left: "10%", fadeIn: "0%", solid: "40%", fadeOut: "100%" },
  { blur: "20px", left: "20%", fadeIn: "0%", solid: "45%", fadeOut: "100%" },
  { blur: "36px", left: "30%", fadeIn: "0%", solid: "25%", fadeOut: "100%" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { loading, accessToken } = useSelector((state: RootState) => ({
    loading: state.auth.loading,
    accessToken: state.auth.accessToken,
  }));
  const { t } = useTranslations();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reduceMotion = useReducedMotion();
  const shake = useAnimationControls();
  const [showPassword, setShowPassword] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [liteGlass, setLiteGlass] = useState(prefersLiteGlass);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (accessToken) navigate("/dashboard", { replace: true });
  }, [accessToken, navigate]);

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

  const nudge = () => {
    if (!reduceMotion) shake.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
  };

  const onSubmit = async (data: LoginForm) => {
    dispatchShowLoader({ message: "Logging in..." });
    try {
      const result = await dispatchLoginUser(data);
      if (result.meta.requestStatus === "fulfilled") {
        navigate("/dashboard");
        dispatchHideLoader();
      } else {
        nudge();
        const errorMessage = result.payload;
        if (errorMessage === "EMAIL_NOT_VERIFIED") {
          dispatchShowToast({ type: "danger", duration: 20000, message: "Your Email is not verified yet. Check your registered email address to verify." });
        } else {
          dispatchShowToast({ type: "danger", message: "Invalid Credentials", duration: 10000 });
        }
      }
    } catch {
      nudge();
      dispatchHideLoader();
      dispatchShowToast({ type: "danger", message: "Invalid Credentials", duration: 10000 });
    } finally {
      dispatchHideLoader();
    }
  };

  const busy = loading || isSubmitting;

  return (
    <div className="relative min-h-dvh overflow-hidden login-stage">
      {/* One scene spans the whole page, so the brand side and the form side are
          literally the same picture; the form side just sees it through glass. */}
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
            thickens toward the form, so the sphere stays faintly visible. */}
        <div
          aria-hidden
          className={cn(
            "login-glass pointer-events-none absolute inset-y-0 right-0 left-0 lg:-left-40",
            (liteGlass || !isDesktop) && "login-glass--lite"
          )}
        >
          {isDesktop && !liteGlass &&
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

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative w-full max-w-[400px]"
        >
          <motion.div animate={shake}>
            <SpotlightCard>
              <motion.div variants={container} initial="hidden" animate="show" className="p-8 sm:p-9">
                {/* Heading */}
                <motion.div variants={item} className="mb-8">
                  <img src="/logo.png" alt="" width={40} height={40} className="mb-5 lg:hidden" />
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {t("login.welcome", "Welcome back")}
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t("login.subtitle", "Sign in to continue to AIMS")}
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit(onSubmit, nudge)} className="space-y-5" noValidate>
                  {/* Identifier */}
                  <motion.div variants={item} className="space-y-2">
                    <Label htmlFor="identifier" className="text-sm font-medium">
                      {t("common.usernameOrEmail", "Username / Email / Phone")}
                    </Label>
                    <GlowField invalid={!!errors.identifier}>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="identifier"
                          type="text"
                          autoComplete="username"
                          autoFocus
                          placeholder={t("login.identifier.placeholder", "you@company.com")}
                          aria-invalid={!!errors.identifier}
                          {...register("identifier")}
                          className="h-11 rounded-[7px] border-0 bg-card dark:bg-card pl-10 shadow-none focus-visible:ring-0"
                        />
                      </div>
                    </GlowField>
                    <FieldError message={errors.identifier?.message} />
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={item} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        {t("password", "Password")}
                      </Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {t("common.forgotPassword", "Forgot Password?")}
                      </Link>
                    </div>
                    <GlowField invalid={!!errors.password}>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={t("password.placeholder", "Enter your password")}
                          aria-invalid={!!errors.password}
                          {...register("password")}
                          className="h-11 rounded-[7px] border-0 bg-card dark:bg-card pl-10 pr-10 shadow-none focus-visible:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </GlowField>
                    <FieldError message={errors.password?.message} />
                  </motion.div>

                  {/* Submit */}
                  <motion.div variants={item} className="pt-1">
                    <button
                      type="submit"
                      disabled={busy}
                      className={cn(
                        "login-shimmer group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg",
                        "bg-primary text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25",
                        "transition-[box-shadow,opacity,transform] duration-200 hover:shadow-xl hover:shadow-primary/30 active:translate-y-px",
                        "disabled:cursor-not-allowed disabled:opacity-70 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                      )}
                    >
                      {busy ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t("common.loggingIn", "Logging in...")}
                        </>
                      ) : (
                        <>
                          {t("common.login.title", "Sign In")}
                          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>

                <motion.p variants={item} className="mt-8 text-center text-xs text-muted-foreground">
                  {t("login.footer", "Protected area. Authorized personnel only.")}
                </motion.p>
              </motion.div>
            </SpotlightCard>
          </motion.div>
        </motion.div>
      </main>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return (
    <motion.p
      initial={false}
      animate={{ opacity: message ? 1 : 0, height: message ? "auto" : 0 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden text-xs text-destructive"
      role={message ? "alert" : undefined}
    >
      {message}
    </motion.p>
  );
}
