import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Lock } from "lucide-react";
import type { RootState } from "@/redux/store";
import { useTranslations } from "@/hooks/useTranslations";
import { dispatchLoginUser, dispatchShowLoader, dispatchHideLoader, dispatchShowToast } from "@/lib/dispatch";
import {
  AuthCard,
  AuthField,
  AuthHeading,
  AuthSubmit,
  PasswordField,
} from "@/modules/auth/components/AuthKit";
import { authItem, useShake } from "@/modules/auth/components/authMotion";

const loginSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(6, "Password too short"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { loading, accessToken } = useSelector((state: RootState) => ({
    loading: state.auth.loading,
    accessToken: state.auth.accessToken,
  }));
  const { t } = useTranslations();
  const { controls, nudge } = useShake();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
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

  return (
    <AuthCard shake={controls}>
      <AuthHeading
        title={t("login.welcome", "Welcome back")}
        subtitle={t("login.subtitle", "Sign in to continue to AIMS")}
      />

      <form onSubmit={handleSubmit(onSubmit, nudge)} className="space-y-5" noValidate>
        <AuthField
          id="identifier"
          label={t("common.usernameOrEmail", "Username / Email / Phone")}
          icon={User}
          autoComplete="username"
          autoFocus
          placeholder={t("login.identifier.placeholder", "you@company.com")}
          registration={register("identifier")}
          error={errors.identifier?.message}
        />
        <PasswordField
          id="password"
          label={t("password", "Password")}
          icon={Lock}
          autoComplete="current-password"
          placeholder={t("password.placeholder", "Enter your password")}
          registration={register("password")}
          error={errors.password?.message}
          labelAside={
            <Link to="/forgot-password" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
              {t("common.forgotPassword", "Forgot Password?")}
            </Link>
          }
        />
        <AuthSubmit busy={loading || isSubmitting} busyLabel={t("common.loggingIn", "Logging in...")}>
          {t("common.login.title", "Sign In")}
        </AuthSubmit>
      </form>

      <motion.p variants={authItem} className="mt-8 text-center text-xs text-muted-foreground">
        {t("login.footer", "Protected area. Authorized personnel only.")}
      </motion.p>
    </AuthCard>
  );
}
