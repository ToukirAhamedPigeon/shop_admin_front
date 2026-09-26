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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Card className="border border-border shadow-xl rounded-xl overflow-hidden bg-card py-0">
          <CardContent className="p-8">
            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-7">
              <div className="mb-4">
                <img src="/logo.png" alt="App Logo" className="w-12 h-12" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {t("common.appName", "AIMS")}
              </h1>
              <p className="text-sm mt-1 text-muted-foreground">
                AI Powered Management System
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="identifier" className="text-sm font-medium mb-1.5 block">
                  {t("common.usernameOrEmail", "Username / Email / Phone")}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter your username or email"
                  {...register("identifier")}
                  className="h-10 rounded-lg text-sm"
                />
                {errors.identifier && (
                  <p className="text-destructive text-xs mt-1">{errors.identifier.message}</p>
                )}
              </div>

              <div>
                <PasswordInput
                  id="password"
                  label="password"
                  labelFallback="Password"
                  isHidden={true}
                  inputClassName="h-10 rounded-lg text-sm"
                  placeholder="password.placeholder"
                  placeholderFallback="Enter your password"
                  {...register('password')}
                  error={errors.password?.message}
                  showForgotPasswordLink={true}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-lg font-medium text-sm mt-2"
                disabled={loading}
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
