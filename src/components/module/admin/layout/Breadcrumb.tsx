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
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-col gap-2 py-3", className)}
    >
      {/* Title */}
      {showTitle && (
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          {t(title, defaultTitle)}
        </h1>
      )}

      {/* Breadcrumb navigation */}
      {items.length > 0 && (
        <nav
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs w-fit bg-muted border border-border"
          aria-label="Breadcrumb"
        >
          {/* Home Link */}
          <Link
            to="/dashboard"
            className="group flex items-center gap-1 px-1.5 py-0.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
          >
            <Home className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
            <span className="hidden sm:inline text-xs font-medium ml-0.5">Home</span>
          </Link>

          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              {item.href ? (
                <Link
                  to={item.href}
                  className="px-1.5 py-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {t(item.label, item.defaultLabel)}
                </Link>
              ) : (
                <span className="font-semibold px-1.5 py-0.5 text-foreground">
                  {t(item.label, item.defaultLabel)}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}
    </motion.div>
  );
}