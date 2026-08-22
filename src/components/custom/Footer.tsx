// src/components/custom/Footer.tsx
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "relative mt-auto py-3 px-4 bg-card border-t border-border",
        footerClasses
      )}
    >
      {/* Content */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
          Developed by
        </span>
        <Link
          to="https://pigeonic.com"
          target="_blank"
          className={cn(
            "group flex items-center gap-1 transition-colors",
            "text-[11px] font-semibold tracking-wide",
            "text-primary hover:text-primary/80",
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
        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mx-1" />

        <span className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} All rights reserved
        </span>

        {showVersion && (
          <>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mx-1" />
            <span className="text-[10px] font-mono font-semibold text-muted-foreground">
              v1.0.0
            </span>
          </>
        )}
      </div>
    </motion.footer>
  );
}