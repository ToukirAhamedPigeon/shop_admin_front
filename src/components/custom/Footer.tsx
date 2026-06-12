// src/components/custom/Footer.tsx
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAppSelector } from "@/hooks/useRedux";

export type FooterProps = {
  footerClasses?: string;
  linkClasses?: string;
  showVersion?: boolean;
};

export default function Footer({
  footerClasses = "",
  linkClasses = "",
  showVersion = false,
}: FooterProps) {
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "relative mt-auto py-3 px-4",
        footerClasses
      )}
    >
      {/* Glassy background */}
      <div
        className="absolute inset-0 backdrop-blur-lg"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.85), rgba(31, 41, 55, 0.85))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(248, 250, 252, 0.85))',
          borderTop: isDarkMode
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: isDarkMode
            ? '0 -4px 20px rgba(0, 0, 0, 0.1)'
            : '0 -4px 20px rgba(0, 0, 0, 0.03)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-1 flex-wrap">
        <span className="text-[11px] font-medium tracking-wide text-gray-600 dark:text-gray-400">
          Developed by
        </span>
        <Link
          to="https://pigeonic.com"
          target="_blank"
          className={cn(
            "group flex items-center gap-1 transition-all duration-300",
            "text-[11px] font-semibold tracking-wide",
            "text-indigo-600 dark:text-indigo-400",
            "hover:text-indigo-700 dark:hover:text-indigo-300",
            "hover:scale-105 transition-transform",
            linkClasses
          )}
        >
          <span>Pigeonic</span>
          <svg
            className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>

        {/* Decorative dot */}
        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-1" />

        <span className="text-[10px] text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} All rights reserved
        </span>

        {showVersion && (
          <>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-1" />
            <span className="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400">
              v1.0.0
            </span>
          </>
        )}
      </div>
    </motion.footer>
  );
}