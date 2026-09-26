import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  isTitle: boolean;
  className?: string;
  titleClassName?: string;
}

export default function Logo({ isTitle, className, titleClassName }: LogoProps) {
  return (
    <Link to="/" className={cn("flex items-center gap-3", className)}>
      {/* Logo background adapts to light/dark theme */}
      <img src="/logo.png" alt="Logo" width={32} height={32} className="shrink-0" />

      {isTitle && (
        <span
          className={cn(
            "text-lg font-semibold text-foreground",
            titleClassName
          )}
        >
          Shop Admin
        </span>
      )}
    </Link>
  );
}
