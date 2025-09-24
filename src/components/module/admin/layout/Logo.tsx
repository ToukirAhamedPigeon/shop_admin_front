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
      <div className="bg-white/80 dark:bg-gray-800/80 p-[2px] rounded-full transition-colors duration-300">
        <img src="/logo.png" alt="Logo" width={32} height={32} />
      </div>

      {isTitle && (
        <span
          className={cn(
            "text-lg font-semibold text-gray-100 transition-colors duration-300",
            titleClassName
          )}
        >
          Shop Admin
        </span>
      )}
    </Link>
  );
}
