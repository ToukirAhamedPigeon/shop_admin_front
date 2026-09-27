// src/modules/dashboard/components/Panel.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashItem } from "./dashboardMotion";

/** Titled dashboard card with an optional "view all" link in the header. */
export default function Panel({
  title,
  subtitle,
  to,
  linkLabel,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  to?: string;
  linkLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={dashItem}
      className={cn("flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs md:p-6", className)}
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {to && linkLabel && (
          <Link
            to={to}
            className="group inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-primary outline-none hover:underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {linkLabel}
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </motion.section>
  );
}
