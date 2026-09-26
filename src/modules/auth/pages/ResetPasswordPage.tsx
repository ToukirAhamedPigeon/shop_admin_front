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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <Card className="border border-border shadow-xl rounded-xl overflow-hidden bg-card py-0">
            {success ? (
              <SuccessMessage
                title="Password Reset Successfully"
                message="Your password has been updated. Redirecting to Login page..."
              />
            ) : (
              <CardContent className="p-8">
                <div className="flex flex-col items-center mb-7">
                  <div className="mb-4">
                    <KeyRound className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    {t("common.resetPassword", "Reset Password")}
                  </h1>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Enter your new password below
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <PasswordInput
                    id="password"
                    label="password"
                    labelFallback="New Password"
                    isHidden={true}
                    inputClassName="h-10 rounded-lg text-sm"
                    placeholderFallback="Enter new password"
                    {...register("password")}
                    error={errors.password?.message}
                  />

                  <PasswordInput
                    id="confirmPassword"
                    label="confirm password"
                    labelFallback="Confirm Password"
                    isHidden={true}
                    inputClassName="h-10 rounded-lg text-sm"
                    placeholderFallback="Re-enter password"
                    {...register("confirmPassword")}
                    error={errors.confirmPassword?.message}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-lg font-semibold text-sm"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full flex items-center justify-center gap-1.5 text-sm mt-1 text-muted-foreground hover:text-foreground transition-colors"
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