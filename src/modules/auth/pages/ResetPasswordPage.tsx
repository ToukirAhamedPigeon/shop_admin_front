import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { KeyRound, Lock, ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { ResetPasswordApi } from "@/routes/api";
import { useTranslations } from "@/hooks/useTranslations";
import { dispatchShowToast } from "@/lib/dispatch";
import {
  AuthAction,
  AuthCard,
  AuthHeading,
  AuthStatus,
  AuthSubmit,
  BackToLogin,
  PasswordField,
} from "@/modules/auth/components/AuthKit";
import { useShake } from "@/modules/auth/components/authMotion";

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
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { controls, nudge } = useShake();

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
      nudge();
      dispatchShowToast({ type: "danger", message: err.response?.data?.message || "Failed to reset password" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard key="done">
        <AuthStatus
          state="success"
          title={t("reset.done.title", "Password updated")}
          message={t("reset.done.message", "Your password has been changed. Redirecting you to sign in...")}
        >
          <AuthAction to="/login" icon={ArrowRight}>
            {t("common.goToLogin", "Go to Login")}
          </AuthAction>
        </AuthStatus>
      </AuthCard>
    );
  }

  return (
    <AuthCard shake={controls} key="form">
      <AuthHeading
        icon={KeyRound}
        title={t("common.resetPassword", "Reset Password")}
        subtitle={t("reset.subtitle", "Choose a new password for your account.")}
      />
      <form onSubmit={handleSubmit(onSubmit, nudge)} className="space-y-5" noValidate>
        <PasswordField
          id="password"
          label={t("reset.newPassword", "New Password")}
          icon={Lock}
          autoComplete="new-password"
          autoFocus
          placeholder={t("reset.newPassword.placeholder", "Enter new password")}
          registration={register("password")}
          error={errors.password?.message}
        />
        <PasswordField
          id="confirmPassword"
          label={t("reset.confirmPassword", "Confirm Password")}
          icon={Lock}
          autoComplete="new-password"
          placeholder={t("reset.confirmPassword.placeholder", "Re-enter password")}
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        <AuthSubmit busy={loading} busyLabel={t("reset.submitting", "Resetting...")}>
          {t("common.resetPassword", "Reset Password")}
        </AuthSubmit>
      </form>
      <BackToLogin label={t("common.backToLogin", "Back to Login")} />
    </AuthCard>
  );
}
