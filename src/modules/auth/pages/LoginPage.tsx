import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/redux/store";
import { useTranslations } from "@/hooks/useTranslations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/custom/FormInputs";
import { motion } from "framer-motion";
import { dispatchLoginUser, dispatchShowLoader, dispatchHideLoader, dispatchShowToast } from "@/lib/dispatch";
import AuthBackground from "@/modules/auth/components/AuthBackground";
import AuthHeader from "@/modules/auth/components/AuthHeader";

const loginSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(6, "Password too short"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { loading, accessToken, theme } = useSelector((state: RootState) => ({
    loading: state.auth.loading,
    accessToken: state.auth.accessToken,
    theme: state.theme.current,
  }));
  const { t } = useTranslations();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (accessToken) navigate("/dashboard", { replace: true });
  }, [accessToken, navigate]);

  const onSubmit = async (data: LoginForm) => {
    dispatchShowLoader({ message: "Logging in..." });
    try {
      const result = await dispatchLoginUser(data);
      if (result.meta.requestStatus === "fulfilled") {
        navigate("/dashboard");
        dispatchHideLoader();
      } else {
        const errorMessage = result.payload;
        if (errorMessage === "EMAIL_NOT_VERIFIED") {
          dispatchShowToast({ type: "danger", duration: 20000, message: "Your Email is not verified yet. Check your registered email address to verify." });
        } else {
          dispatchShowToast({ type: "danger", message: "Invalid Credentials", duration: 10000 });
        }
      }
    } catch {
      dispatchHideLoader();
      dispatchShowToast({ type: "danger", message: "Invalid Credentials", duration: 10000 });
    } finally {
      dispatchHideLoader();
    }
  };

  return (
    <AuthBackground theme={theme}>
      <AuthHeader />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <Card
          className="shadow-2xl border-0 rounded-2xl overflow-hidden"
          style={{
            background: theme === 'dark'
              ? 'rgba(12, 18, 40, 0.82)'
              : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            boxShadow: theme === 'dark'
              ? '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(100,140,255,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 8px 40px rgba(10,30,80,0.18), 0 0 0 1px rgba(255,255,255,0.7), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          {/* Top accent line */}
          <div
            className="h-0.5 w-full"
            style={{
              background: 'linear-gradient(to right, rgba(100,120,255,0.6), rgba(180,100,255,0.4), rgba(100,120,255,0.6))',
            }}
          />

          <CardContent className="p-8">
            {/* Logo + Title */}
            <div
              className="flex flex-col items-center mb-7"
              // initial={{ opacity: 0, y: -10 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div
                className="mb-3 p-2.5 rounded-2xl"
                style={{
                  background: theme === 'dark'
                    ? 'rgba(100,130,255,0.12)'
                    : 'rgba(60,100,220,0.08)',
                  border: '1px solid rgba(100,140,255,0.2)',
                }}
              >
                <img src="/logo.png" alt="App Logo" className="w-12 h-12" />
              </div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{
                  color: theme === 'dark' ? '#e8eeff' : '#1a2a50',
                  letterSpacing: '-0.02em',
                }}
              >
                {t("common.appName", "AIMS")}
              </h1>
              <p className="text-sm mt-1" style={{ color: theme === 'dark' ? 'rgba(160,180,220,0.7)' : 'rgba(60,80,140,0.9)' }}>
                AI Powered Management System
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label
                  htmlFor="identifier"
                  className="text-sm font-medium mb-1.5 block"
                  style={{ color: theme === 'dark' ? 'rgba(180,200,240,0.9)' : 'rgba(40,60,120,0.85)' }}
                >
                  {t("common.usernameOrEmail", "Username / Email / Phone")}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter your username or email"
                  {...register("identifier")}
                  className="h-10 rounded-xl text-sm transition-all focus:ring-2"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(240,245,255,0.9)',
                    border: theme === 'dark' ? '1px solid rgba(100,140,255,0.2)' : '1px solid rgba(80,120,220,0.2)',
                    color: theme === 'dark' ? '#d8e4ff' : '#1a2a50',
                  }}
                />
                {errors.identifier && (
                  <p className="text-red-400 text-xs mt-1">{errors.identifier.message}</p>
                )}
              </div>

              <div>
                <PasswordInput
                  id="password"
                  label="password"
                  labelFallback="Password"
                  isHidden={true}
                  inputClassName="h-10 rounded-xl text-sm"
                  placeholder="password.placeholder"
                  placeholderFallback="Enter your password"
                  {...register('password')}
                  error={errors.password?.message}
                  showForgotPasswordLink={true}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl font-semibold text-sm mt-2 transition-all duration-200"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #4060e0 0%, #7040c8 100%)',
                  boxShadow: '0 4px 16px rgba(80,80,220,0.35)',
                  border: 'none',
                  color: '#fff',
                }}
              >
                {loading ? t("common.loggingIn", "Logging in...") : t("common.login.title", "Sign In")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </AuthBackground>
  );
}