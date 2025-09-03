import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    <footer
      className={cn(
        "flex items-center justify-center gap-1 py-2 text-gray-700 dark:text-gray-300",
        footerClasses
      )}
    >
      <span className="text-[10px]">Developed by</span>
      <Link
        to="https://pigeonic.com"
        target="_blank"
        className={cn("hover:underline font-medium text-gray-900 dark:text-gray-100", linkClasses)}
      >
        Pigeonic
      </Link>

      {showVersion && (
        <span className="hidden md:block">
          &nbsp;&nbsp;&nbsp;
          <small className="font-bold text-[10px] text-gray-800 dark:text-gray-200">
            v1.0.0
          </small>
        </span>
      )}
    </footer>
  );
}
