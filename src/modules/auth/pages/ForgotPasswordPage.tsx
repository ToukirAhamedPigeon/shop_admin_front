import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, MailCheck, RotateCcw, ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { ForgotPasswordApi } from "@/routes/api";
import { useTranslations } from "@/hooks/useTranslations";
import { dispatchShowToast } from "@/lib/dispatch";
import {
  AuthAction,
  AuthCard,
  AuthField,
  AuthHeading,
  AuthStatus,
  AuthSubmit,
  BackToLogin,
} from "@/modules/auth/components/AuthKit";
import { useShake } from "@/modules/auth/components/authMotion";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
});
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslations();
  const { controls, nudge } = useShake();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      await api.post(ForgotPasswordApi.url, data);
      setSentTo(data.email);
    } catch (err: any) {
      nudge();
      dispatchShowToast({ type: "danger", message: err.response?.data?.message || "Error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCard key="sent">
        <AuthStatus
          state="success"
          title={t("forgot.sent.title", "Check your inbox")}
          message={
            <>
              {t("forgot.sent.message", "We sent a password reset link to")}{" "}
              <span className="font-medium text-foreground">{sentTo}</span>.
            </>
          }
        >
          <AuthAction to="/login" icon={ArrowRight}>
            {t("common.goToLogin", "Go to Login")}
          </AuthAction>
          <AuthAction variant="secondary" icon={RotateCcw} onClick={() => setSentTo(null)}>
            {t("common.sendAgain", "Send again")}
          </AuthAction>
        </AuthStatus>
      </AuthCard>
    );
  }

  return (
    <AuthCard shake={controls} key="form">
      <AuthHeading
        icon={MailCheck}
        title={t("common.forgotPassword", "Forgot Password")}
        subtitle={t("forgot.subtitle", "Enter your email and we'll send you a link to reset your password.")}
      />
      <form onSubmit={handleSubmit(onSubmit, nudge)} className="space-y-5" noValidate>
        <AuthField
          id="email"
          type="email"
          label={t("common.email", "Email")}
          icon={Mail}
          autoComplete="email"
          autoFocus
          placeholder={t("forgot.email.placeholder", "you@company.com")}
          registration={register("email")}
          error={errors.email?.message}
        />
        <AuthSubmit busy={isLoading} busyLabel={t("common.sendResetLinkLoading", "Sending...")}>
          {t("common.sendResetLink", "Send Reset Link")}
        </AuthSubmit>
      </form>
      <BackToLogin label={t("common.backToLogin", "Back to Login")} />
    </AuthCard>
  );
}
