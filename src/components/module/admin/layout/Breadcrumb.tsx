import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

export type Crumb = {
  label: string;
  defaultLabel?: string;
  href?: string; // if undefined, it's the current page
};

export type BreadcrumbProps = {
  items: Crumb[];
  title?: string;
  defaultTitle?: string;
  showTitle?: boolean;
  className?: string;
};

export default function Breadcrumb({
  items,
  title = "",
  defaultTitle = "",
  showTitle = true,
  className = "",
}: BreadcrumbProps) {
  const { t } = useTranslations();

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-4",
        className
      )}
    >
      {/* Title */}
      {showTitle && (
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
          {t(title, defaultTitle)}
        </h1>
      )}

      {/* Breadcrumbs */}
      {items.length > 0 && (
        <nav className="flex items-center text-xs md:text-sm flex-wrap gap-x-2">
          {/* Home */}
          <Link
            to="/dashboard"
            className="hover:underline flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* Dynamic items */}
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {/* Separator */}
              <span className="text-gray-800/50 dark:text-gray-400/50">/</span>

              {item.href ? (
                <Link
                  to={item.href}
                  className="hover:underline text-gray-800/90 dark:text-gray-200/90 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t(item.label, item.defaultLabel)}
                </Link>
              ) : (
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  {t(item.label, item.defaultLabel)}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
