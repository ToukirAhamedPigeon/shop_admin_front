// NotFound.tsx — rendered inside AuthShell (outside the admin layout).
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { AuthAction, AuthCard, AuthHeading, ErrorCode } from "@/modules/auth/components/AuthKit";

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslations();
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  return (
    <AuthCard>
      <ErrorCode code="404" />
      <AuthHeading
        logo={false}
        title={t("errors.notFound.title", "Page not found")}
        subtitle={t("errors.notFound.message", "The page you're looking for doesn't exist or has been moved.")}
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

export default NotFound;
