import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export default function GlobalLoader(): React.ReactElement | null {
  const {
    visible,
    message,
    spinnerColor,
    darkSpinnerColor,
    messageColor,
    darkMessageColor,
  } = useSelector((state: RootState) => state.loader);


  const { current: theme } = useSelector((state: RootState) => state.theme)
  const isDarkMode = theme === "dark"

  if (!visible) return null;

  const activeSpinnerColor = isDarkMode ? darkSpinnerColor : spinnerColor;
  const activeMessageColor = isDarkMode ? darkMessageColor : messageColor;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Site Logo */}
        <div className="relative w-16 h-16 select-none pointer-events-none">
          <img
            src="/logo.png"
            alt="Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>

        {/* Spinner */}
        <div
          className="w-8 h-8 border-3 border-solid rounded-full animate-spin mt-4 outline-none focus:outline-none select-none"
          style={{
            borderColor: `${activeSpinnerColor} transparent ${activeSpinnerColor} ${activeSpinnerColor}`,
          }}
        />

        {/* Message */}
        {message && (
          <p
            className="text-xl font-medium"
            style={{
              color: activeMessageColor,
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
