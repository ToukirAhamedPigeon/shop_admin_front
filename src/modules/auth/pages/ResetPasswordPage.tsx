import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordInput } from "@/components/custom/FormInputs";
import { motion } from "framer-motion";
import api from "@/lib/axios";
import { ResetPasswordApi } from "@/routes/api";
import { useTranslations } from "@/hooks/useTranslations";
import FullPageLoader from "@/components/custom/FullPageLoader";
import SuccessMessage from "@/components/custom/SuccessMessage";
import { dispatchShowToast } from "@/lib/dispatch";
import AuthBackground from "@/modules/auth/components/AuthBackground";
import AuthHeader from "@/modules/auth/components/AuthHeader";
import { KeyRound, ArrowLeft } from "lucide-react";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password too short"),
    confirmPassword: z.string().min(6, "Password too short"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { theme } = useSelector((state: RootState) => ({ theme: state.theme.current }));
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      await api.post(ResetPasswordApi.url, { token, password: data.password });
      setSuccess(true);
      dispatchShowToast({ type: "success", message: "Password reset successfully." });
      setTimeout(() => navigate("/login"), 5000);
    } catch (err: any) {
      dispatchShowToast({ type: "danger", message: err.response?.data?.message || "Failed to reset password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <FullPageLoader message="Resetting Password..." type="bars" />}
      <AuthBackground theme={theme}>
        <AuthHeader />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="w-full max-w-sm"
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
                title="Password Reset Successfully"
                message="Your password has been updated. Redirecting to Login page..."
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
                    <KeyRound className="w-10 h-10" style={{ color: theme === 'dark' ? '#8090e0' : '#5060c0' }} />
                  </div>
                  <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: theme === 'dark' ? '#e8eeff' : '#1a2a50', letterSpacing: '-0.02em' }}
                  >
                    {t("common.resetPassword", "Reset Password")}
                  </h1>
                  <p className="text-sm mt-1" style={{ color: theme === 'dark' ? 'rgba(160,180,220,0.7)' : 'rgba(60,80,140,0.6)' }}>
                    Enter your new password below
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <PasswordInput
                    id="password"
                    label="password"
                    labelFallback="New Password"
                    isHidden={true}
                    inputClassName="h-10 rounded-xl text-sm"
                    placeholderFallback="Enter new password"
                    {...register("password")}
                    error={errors.password?.message}
                  />

                  <PasswordInput
                    id="confirmPassword"
                    label="confirm password"
                    labelFallback="Confirm Password"
                    isHidden={true}
                    inputClassName="h-10 rounded-xl text-sm"
                    placeholderFallback="Re-enter password"
                    {...register("confirmPassword")}
                    error={errors.confirmPassword?.message}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-xl font-semibold text-sm transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #4060e0 0%, #7040c8 100%)',
                      boxShadow: '0 4px 16px rgba(80,80,220,0.35)',
                      border: 'none',
                      color: '#fff',
                    }}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full flex items-center justify-center gap-1.5 text-sm mt-1 transition-colors"
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
      </AuthBackground>
    </>
  );
}