import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

interface FullPageLoaderProps {
  message?: string;
  type?: "circular" | "bars" | "pulse"; // multiple loader types
}

export default function FullPageLoader({
  message,
  type = "circular",
}: FullPageLoaderProps) {
  const { theme } = useSelector((state: RootState) => ({
    theme: state.theme.current,
  }));

  const colorClass =
    theme === "light" ? "bg-blue-600 border-blue-600" : "bg-white border-white";

  return (
    <div
      className={`
        fixed inset-0 z-[9999]
        flex flex-col items-center justify-center
        backdrop-blur-sm
        ${theme === "light" ? "bg-white/10" : "bg-black/10"}
      `}
    >
      {/* Loader Type Switch */}
      {type === "circular" && (
        <div
          className={`
            w-12 h-12 rounded-full border-4 border-t-transparent animate-spin
            ${theme === "light" ? "border-blue-600" : "border-white"}
          `}
        />
      )}

      {type === "bars" && (
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`
                w-2 h-6 rounded-sm ${colorClass}
                animate-[bounce_0.6s_infinite]
              `}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {type === "pulse" && (
        <div
          className={`
            w-12 h-12 rounded-full border-4 opacity-70
            ${theme === "light" ? "border-blue-600" : "border-white"}
            animate-ping
          `}
        />
      )}

      {/* Optional Message */}
      {message && (
        <p
          className={`
            mt-4 text-lg font-medium
            ${theme === "light" ? "text-gray-900" : "text-gray-200"}
          `}
        >
          {message}
        </p>
      )}
    </div>
  );
}
