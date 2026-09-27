// Unauthorized.tsx — rendered inside AuthShell (outside the admin layout).
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { AuthAction, AuthCard, AuthHeading, ErrorCode } from "@/modules/auth/components/AuthKit";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { t } = useTranslations();
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  return (
    <AuthCard>
      <ErrorCode code="403" />
      <AuthHeading
        logo={false}
        title={t("errors.unauthorized.title", "Access denied")}
        subtitle={t(
          "errors.unauthorized.message",
          "You don't have permission to view this page. Ask an administrator if you think this is a mistake."
        )}
      />
      <div className="flex flex-col gap-3">
        <AuthAction to="/" icon={Home}>
          {t("errors.goHome", "Go home")}
        </AuthAction>
        {canGoBack && (
          <AuthAction variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
            {t("errors.goBack", "Go back")}
          </AuthAction>
        )}
      </div>
    </AuthCard>
  );
}
