import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../redux/slices/authSlice";
import type { RootState, AppDispatch } from "../redux/store";
import { useTranslations } from "../hooks/useTranslations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/custom/FormInputs";
import { motion } from "framer-motion";
import LanguageSwitcher from "@/components/custom/LanguageSwitcher";

// Schema
const loginSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(6, "Password too short"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, accessToken } = useSelector(
    (state: RootState) => state.auth
  );
  const { t } = useTranslations();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (accessToken) {
      navigate("/dashboard", { replace: true });
    }
  }, [accessToken, navigate]);

  const onSubmit = async (data: LoginForm) => {
    const result = await dispatch(loginUser(data));
    if (result.meta.requestStatus === "fulfilled") {
      navigate("/dashboard");
    }
  };

  return (
  
      <div
        className="fixed inset-0 flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      >
        {/* Language Switcher Top Right */}
        <motion.div
        className="absolute top-4 right-4 z-20"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        >
            <LanguageSwitcher />
        </motion.div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#141e30]/90 to-[#243b55]/90 z-0" />

        {/* Blurred blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-yellow-500 rounded-full blur-[160px] opacity-30 top-[-150px] left-[-100px]" />
          <div className="absolute w-[400px] h-[400px] bg-red-400 rounded-full blur-[120px] opacity-20 bottom-[-120px] right-[-80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className="relative z-10"
        >
          <Card className="min-w-[340px] md:min-w-96 shadow-xl backdrop-blur-lg bg-white/90 border border-white/40 rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center mb-6">
                <img
                  src="/logo.png"
                  alt="App Logo"
                  className="mb-2 w-14 h-14"
                />
                <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
                  {t("common.appName", "Shop Admin")}
                </h1>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="identifier" className="text-gray-700">
                    {t("common.usernameOrEmail", "Username / Email / Phone")}
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Enter your username or email or phone"
                    {...register("identifier")}
                    className="mt-1 border-gray-400 bg-white"
                  />
                  {errors.identifier && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.identifier.message}
                    </p>
                  )}
                </div>

                <div>
                  <PasswordInput
                    id="password"
                    label="password"
                    labelFallback="Password"
                    isHidden={true}
                    inputClassName='bg-white'
                    placeholder="password.placeholder"
                    placeholderFallback="Enter your password"
                    {...register('password')}
                    error={errors.password?.message}
                  />
                </div>

                {error && (
                  <motion.p
                    className="text-red-600 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white transition duration-200"
                  disabled={loading}
                >
                  {loading ? t("common.loggingIn", "Logging in...") : t("common.login.title", "Login")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
  );
}
