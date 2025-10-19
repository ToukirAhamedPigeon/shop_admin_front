// components/common/GlobalLoader.tsx
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store"; // adjust import path based on your store setup

export default function GlobalLoader(): React.ReactElement | null {
  const { visible, message, spinnerColor, messageColor } = useSelector(
    (state: RootState) => state.loader
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 border-4 border-t-transparent border-solid rounded-full animate-spin"
          style={{
            borderColor: `${spinnerColor} transparent ${spinnerColor} ${spinnerColor}`,
          }}
        ></div>
        {message && (
          <p className="text-lg font-medium" style={{ color: messageColor }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
