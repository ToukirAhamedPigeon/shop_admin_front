import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import FullPageLoader from "@/components/custom/FullPageLoader";
import SuccessMessage from "@/components/custom/SuccessMessage";
import { verifyEmail } from "@/modules/auth/api";
import { dispatchShowToast } from "@/lib/dispatch";
import AuthBackground from "@/modules/auth/components/AuthBackground";
import AuthHeader from "@/modules/auth/components/AuthHeader";
import { ShieldAlert } from "lucide-react";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { theme } = useSelector((state: RootState) => ({ theme: state.theme.current }));
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        dispatchShowToast({ type: "danger", message: "Invalid verification link" });
        setLoading(false);
        return;
      }
      try {
        const res = await verifyEmail(token);
        setSuccess(true);
        dispatchShowToast({ type: "success", message: res.data || "Email verified successfully" });
        setTimeout(() => navigate("/login"), 5000);
      } catch (err: any) {
        dispatchShowToast({ type: "danger", message: err.response?.data || "Verification failed" });
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token, navigate]);

  if (loading) return <FullPageLoader message="Verifying Email..." type="bars" />;

  return (
    <AuthBackground theme={theme}>
      <AuthHeader />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Card className="border border-border shadow-xl rounded-xl overflow-hidden bg-card py-0">
          <CardContent className="p-8 text-center">
            {success ? (
              <SuccessMessage
                title="Email Verified Successfully"
                message="Your email has been verified. Redirecting to Login..."
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <ShieldAlert className="w-12 h-12 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-destructive">
                  Email Verification Failed
                </h2>
                <p className="text-sm text-muted-foreground">
                  The verification link is invalid or has expired.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-1"
                >
                  Go to Login
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AuthBackground>
  );
}