import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { verifyEmail } from "@/modules/auth/api";
import { dispatchShowToast } from "@/lib/dispatch";
import { useTranslations } from "@/hooks/useTranslations";
import { AuthAction, AuthCard, AuthStatus } from "@/modules/auth/components/AuthKit";

type Status = "loading" | "success" | "error";

// The API answers with a plain string; guard against anything else so a
// non-string body can't crash the toast renderer.
const asMessage = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslations();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        dispatchShowToast({ type: "danger", message: "Invalid verification link" });
        setStatus("error");
        return;
      }
      try {
        const res = await verifyEmail(token);
        setStatus("success");
        dispatchShowToast({ type: "success", message: asMessage(res.data, "Email verified successfully") });
        setTimeout(() => navigate("/login"), 5000);
      } catch (err: any) {
        setStatus("error");
        dispatchShowToast({ type: "danger", message: asMessage(err.response?.data, "Verification failed") });
      }
    };
    verify();
  }, [token, navigate]);

  return (
    // Keyed by status so each state gets its own entrance.
    <AuthCard key={status}>
      {status === "loading" && (
        <AuthStatus
          state="loading"
          title={t("verify.loading.title", "Verifying your email")}
          message={t("verify.loading.message", "This only takes a moment.")}
        />
      )}
      {status === "success" && (
        <AuthStatus
          state="success"
          title={t("verify.success.title", "Email verified")}
          message={t("verify.success.message", "Your email has been verified. Redirecting you to sign in...")}
        >
          <AuthAction to="/login" icon={ArrowRight}>
            {t("common.goToLogin", "Go to Login")}
          </AuthAction>
        </AuthStatus>
      )}
      {status === "error" && (
        <AuthStatus
          state="error"
          title={t("verify.error.title", "Verification failed")}
          message={t("verify.error.message", "This verification link is invalid or has expired.")}
        >
          <AuthAction to="/login" icon={ArrowRight}>
            {t("common.goToLogin", "Go to Login")}
          </AuthAction>
        </AuthStatus>
      )}
    </AuthCard>
  );
}
