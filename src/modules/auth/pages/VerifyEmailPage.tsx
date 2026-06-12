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
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <Card
          className="shadow-2xl border-0 rounded-2xl overflow-hidden"
          style={{
            background: theme === 'dark' ? 'rgba(12, 18, 40, 0.82)' : 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            boxShadow: theme === 'dark'
              ? '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(100,140,255,0.12)'
              : '0 8px 40px rgba(10,30,80,0.18), 0 0 0 1px rgba(255,255,255,0.7)',
          }}
        >
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, rgba(100,120,255,0.6), rgba(180,100,255,0.4), rgba(100,120,255,0.6))' }} />

          <CardContent className="p-8 text-center">
            {success ? (
              <SuccessMessage
                title="Email Verified Successfully"
                message="Your email has been verified. Redirecting to Login..."
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: 'rgba(220,40,40,0.1)',
                    border: '1px solid rgba(220,80,80,0.25)',
                  }}
                >
                  <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: theme === 'dark' ? '#fca5a5' : '#b91c1c', letterSpacing: '-0.01em' }}
                >
                  Email Verification Failed
                </h2>
                <p style={{ color: theme === 'dark' ? 'rgba(160,180,220,0.7)' : 'rgba(80,80,120,0.7)' }} className="text-sm">
                  The verification link is invalid or has expired.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="text-sm font-medium transition-colors mt-1"
                  style={{ color: theme === 'dark' ? '#a0b0f0' : '#4060c0' }}
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