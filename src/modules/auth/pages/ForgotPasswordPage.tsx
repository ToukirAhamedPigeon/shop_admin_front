import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import type { RootState } from "@/redux/store";
import api from "@/lib/axios";
import { ForgotPasswordApi } from "@/routes/api";
import { useTranslations } from "@/hooks/useTranslations";
import SuccessMessage from "@/components/custom/SuccessMessage";
import FullPageLoader from "@/components/custom/FullPageLoader";
import { dispatchShowToast } from "@/lib/dispatch";
import AuthBackground from "@/modules/auth/components/AuthBackground";
import AuthHeader from "@/modules/auth/components/AuthHeader";
import { Mail, ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
});
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { theme } = useSelector((state: RootState) => ({ theme: state.theme.current }));
  const { t } = useTranslations();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      await api.post(ForgotPasswordApi.url, data);
      setSuccess(true);
    } catch (err: any) {
      dispatchShowToast({ type: "danger", message: err.response?.data?.message || "Error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthBackground theme={theme}>
      <AuthHeader />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="w-full max-w-md"
      >
        <Card
          className="shadow-2xl border-0 rounded-2xl overflow-hidden"
          style={{
            background: theme === 'dark' ? 'rgba(12, 18, 40, 0.82)' : 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            boxShadow: theme === 'dark'
              ? '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(100,140,255,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 8px 40px rgba(10,30,80,0.18), 0 0 0 1px rgba(255,255,255,0.7)',
          }}
        >
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, rgba(100,120,255,0.6), rgba(180,100,255,0.4), rgba(100,120,255,0.6))' }} />

          {success ? (
            <SuccessMessage
              title="Password Reset Email Sent!"
              message="A password reset link has been sent to your email. Please check your inbox."
              onLogin={() => navigate("/login")}
              onBack={() => setSuccess(false)}
            />
          ) : (
            <CardContent className="p-8">
              <motion.div
                className="flex flex-col items-center mb-7"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div
                  className="mb-3 p-3 rounded-2xl"
                  style={{
                    background: theme === 'dark' ? 'rgba(100,130,255,0.12)' : 'rgba(60,100,220,0.08)',
                    border: '1px solid rgba(100,140,255,0.2)',
                  }}
                >
                  <Mail className="w-10 h-10" style={{ color: theme === 'dark' ? '#8090e0' : '#5060c0' }} />
                </div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: theme === 'dark' ? '#e8eeff' : '#1a2a50', letterSpacing: '-0.02em' }}
                >
                  {t("common.forgotPassword", "Forgot Password")}
                </h1>
                <p className="text-sm mt-1 text-center" style={{ color: theme === 'dark' ? 'rgba(160,180,220,0.7)' : 'rgba(60,80,140,0.8)' }}>
                  Enter your email to receive a reset link
                </p>
              </motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium mb-1.5 block"
                    style={{ color: theme === 'dark' ? 'rgba(180,200,240,0.9)' : 'rgba(40,60,120,0.85)' }}
                  >
                    {t("common.email", "Email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register("email")}
                    className="h-10 rounded-xl text-sm"
                    style={{
                      background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(240,245,255,0.9)',
                      border: theme === 'dark' ? '1px solid rgba(100,140,255,0.2)' : '1px solid rgba(80,120,220,0.2)',
                      color: theme === 'dark' ? '#d8e4ff' : '#1a2a50',
                    }}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl font-semibold text-sm transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #4060e0 0%, #7040c8 100%)',
                    boxShadow: '0 4px 16px rgba(80,80,220,0.35)',
                    border: 'none',
                    color: '#fff',
                  }}
                >
                  {isLoading ? t("common.sendResetLinkLoading", "Sending...") : t("common.sendResetLink", "Send Reset Link")}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm mt-1 transition-colors cursor-pointer"
                  style={{ color: theme === 'dark' ? 'rgba(140,160,220,0.8)' : 'rgba(60,90,180,0.8)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t("common.backToLogin", "Back to Login")}
                </button>
              </form>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {isLoading && <FullPageLoader type="bars" message={t("common.sendingResetLink", "Sending Reset Link...")} />}
    </AuthBackground>
  );
}