import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import LanguageSwitcher from "@/components/custom/LanguageSwitcher";
import { ThemeToggleButton } from "@/components/custom/ThemeToggleButton";
import FullPageLoader from "@/components/custom/FullPageLoader";
import SuccessMessage from "@/components/custom/SuccessMessage";
import { verifyEmail } from "@/modules/auth/api";
import { dispatchShowToast } from "@/lib/dispatch";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { theme } = useSelector((state: RootState) => ({
    theme: state.theme.current,
  }));

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        dispatchShowToast({
          type: "danger",
          message: "Invalid verification link",
        });
        setLoading(false);
        return;
      }

      try {
        const res = await verifyEmail(token);
        setSuccess(true);

        dispatchShowToast({
          type: "success",
          message: res.data || "Email verified successfully",
        });

        setTimeout(() => navigate("/login"), 5000);
      } catch (err: any) {
        dispatchShowToast({
          type: "danger",
          message: err.response?.data || "Verification failed",
        });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, navigate]);

  if (loading) {
    return <FullPageLoader message="Verifying Email..." type="bars" />;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-500"
      style={{
        backgroundImage:
          theme === "light"
            ? "url('/login-bg.jpg')"
            : "url('/login-bg-dark.jpg')",
      }}
    >
      <motion.div
        className="absolute top-4 right-10 z-20 flex items-center gap-3"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <LanguageSwitcher />
        <ThemeToggleButton />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10"
      >
        <Card className="min-w-[340px] md:min-w-96 shadow-xl backdrop-blur-lg bg-white/90 dark:bg-gray-800/80 border border-white/40 dark:border-gray-700/40 rounded-2xl overflow-hidden transition-colors duration-500">
          <CardContent className="p-8 text-center">
            {success ? (
              <SuccessMessage
                title="Email Verified Successfully"
                message="Your email has been verified. Redirecting to Login..."
              />
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-red-600">
                  Email Verification Failed
                </h2>
                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  The verification link is invalid or expired.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-5 text-blue-600 hover:underline"
                >
                  Go to Login
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
