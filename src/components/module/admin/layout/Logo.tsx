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
      <div className="bg-white/80 p-[2px] rounded-full">
        <img src="/logo.png" alt="Logo" width={32} height={32} />
      </div>
      {isTitle && (
        <span className={cn("text-lg font-semibold", titleClassName)}>
          Shop Admin
        </span>
      )}
    </Link>
  );
}
