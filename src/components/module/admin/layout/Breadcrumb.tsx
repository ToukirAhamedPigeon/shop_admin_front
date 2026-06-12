// src/components/module/admin/layout/Breadcrumb.tsx
import { Home, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import { motion } from "framer-motion";
import { useAppSelector } from "@/hooks/useRedux";

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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-col gap-2 py-3", className)}
    >
      {/* Title */}
      {showTitle && (
        <h1
          className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 dark:from-white dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent"
          style={{ letterSpacing: '-0.01em' }}
        >
          {t(title, defaultTitle)}
        </h1>
      )}

      {/* Breadcrumb navigation - Glass effect with transparent background */}
      {items.length > 0 && (
        <nav
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs w-fit transition-all duration-300 backdrop-blur-xl"
          style={{
            background: isDarkMode 
              ? 'rgba(17, 24, 39, 0.4)'
              : 'rgba(255, 255, 255, 0.4)',
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.15)' 
              : '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: isDarkMode 
              ? '0 4px 20px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.05) inset'
              : '0 4px 20px rgba(0,0,0,0.03), 0 1px 0 rgba(255,255,255,0.8) inset',
          }}
          aria-label="Breadcrumb"
        >
          {/* Home Link - Distinct Brand Color */}
          <Link
            to="/dashboard"
            className="group flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all duration-200"
            style={{
              color: isDarkMode ? '#a5b4fc' : '#4f46e5',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isDarkMode ? '#c7d2fe' : '#6366f1';
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(129, 140, 248, 0.2)' : 'rgba(79, 70, 229, 0.1)';
              e.currentTarget.style.backdropFilter = 'blur(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isDarkMode ? '#a5b4fc' : '#4f46e5';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.backdropFilter = 'none';
            }}
          >
            <Home className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
            <span className="hidden sm:inline text-xs font-medium ml-0.5">Home</span>
          </Link>

          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }} />
              {item.href ? (
                <Link
                  to={item.href}
                  className="px-1.5 py-0.5 rounded-md transition-all duration-200"
                  style={{
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = isDarkMode ? '#f8fafc' : '#0f172a';
                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)';
                    e.currentTarget.style.backdropFilter = 'blur(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#475569';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.backdropFilter = 'none';
                  }}
                >
                  {t(item.label, item.defaultLabel)}
                </Link>
              ) : (
                <span 
                  className="font-semibold px-1.5 py-0.5"
                  style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }}
                >
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