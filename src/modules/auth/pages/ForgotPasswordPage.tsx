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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card className="border border-border shadow-md rounded-2xl overflow-hidden bg-card py-0">
          {success ? (
            <SuccessMessage
              title="Password Reset Email Sent!"
              message="A password reset link has been sent to your email. Please check your inbox."
              onLogin={() => navigate("/login")}
              onBack={() => setSuccess(false)}
            />
          ) : (
            <CardContent className="p-8">
              <div className="flex flex-col items-center mb-7">
                <div className="mb-3 p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {t("common.forgotPassword", "Forgot Password")}
                </h1>
                <p className="text-sm mt-1 text-center text-muted-foreground">
                  Enter your email to receive a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                    {t("common.email", "Email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register("email")}
                    className="h-10 rounded-lg text-sm"
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-lg font-semibold text-sm"
                >
                  {isLoading ? t("common.sendResetLinkLoading", "Sending...") : t("common.sendResetLink", "Send Reset Link")}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm mt-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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