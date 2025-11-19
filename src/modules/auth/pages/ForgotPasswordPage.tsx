import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import LanguageSwitcher from "@/components/custom/LanguageSwitcher";
import { ThemeToggleButton } from "@/components/custom/ThemeToggleButton";
import { showToast } from "@/redux/slices/toastSlice";
import api from "@/lib/axios";
import { ForgotPasswordApi } from "@/routes/api";
import { useTranslations } from "@/hooks/useTranslations";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email")
});
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslations();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await api.post(ForgotPasswordApi.url, data);
      dispatch(showToast({ type: "success", message: "Password reset email sent." }));
    } catch (err: any) {
      dispatch(showToast({ type: "danger", message: err.response?.data?.message || "Error" }));
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat transition-colors duration-500
                 bg-white dark:bg-gray-900"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
      }}
    >
      {/* Language & Theme */}
      <motion.div
        className="absolute top-4 right-10 z-20 flex items-center gap-3"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <LanguageSwitcher />
        <ThemeToggleButton />
      </motion.div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#141e30]/90 to-[#243b55]/90 dark:from-[#0f1a2a]/90 dark:to-[#1b2a3f]/90 z-0" />

      {/* Blurred blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-yellow-500 rounded-full blur-[160px] opacity-30 top-[-150px] left-[-100px] dark:bg-yellow-400/30" />
        <div className="absolute w-[400px] h-[400px] bg-red-400 rounded-full blur-[120px] opacity-20 bottom-[-120px] right-[-80px] dark:bg-red-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_80%)]" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        className="relative z-10"
      >
        <Card className="min-w-[400px] md:min-w-[500px] lg:min-w-[600px] shadow-xl backdrop-blur-lg bg-white/90 dark:bg-gray-800/80 border border-white/40 dark:border-gray-700/40 rounded-2xl overflow-hidden transition-colors duration-500">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-6">
              <img src="/logo.png" alt="App Logo" className="mb-2 w-14 h-14" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                {t("common.forgotPassword", "Forgot Password")}
              </h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">
                  {t("common.email", "Email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  {...register("email")}
                  className="mt-1 border-gray-400 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-gray-200 text-white dark:text-black transition duration-200">
                {t("common.sendResetLink", "Send Reset Link")}
              </Button>
              <div className="flex justify-center items-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {t("common.backToLogin", "Go Back to Login")}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
