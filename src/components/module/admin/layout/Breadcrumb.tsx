// src/components/module/admin/layout/Breadcrumb.tsx
import { Home, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import { motion } from "framer-motion";

export type Crumb = {
  label: string;
  defaultLabel?: string;
  href?: string;
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("flex flex-col gap-1.5 pt-1 pb-2", className)}
    >
      {/* Breadcrumb navigation */}
      {items.length > 0 && (
        <nav
          className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-sm hover:text-foreground transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="rounded-sm hover:text-foreground transition-colors"
                  >
                    {t(item.label, item.defaultLabel)}
                  </Link>
                ) : (
                  <span
                    className={cn(isLast && "font-medium text-foreground")}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {t(item.label, item.defaultLabel)}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Title */}
      {showTitle && (
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t(title, defaultTitle)}
        </h1>
      )}
    </motion.div>
  );
}
