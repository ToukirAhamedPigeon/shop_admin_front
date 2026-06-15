// src/components/custom/Loader.tsx
import { useAppSelector } from "@/hooks/useRedux";

interface LoaderProps {
  type?: "circular" | "bars" | "pulse" | "spinner";
  size?: number;
}

export default function Loader({ type = "circular", size = 48 }: LoaderProps) {
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  const baseSize = { width: size, height: size };

  const getGradientColor = () => {
    return isDarkMode
      ? 'from-blue-400 via-purple-400 to-pink-400'
      : 'from-blue-600 via-purple-600 to-pink-600';
  };

  return (
    <div className="flex items-center justify-center">
      {type === "circular" && (
        <div
          className={`rounded-full border-4 border-t-transparent animate-spin bg-gradient-to-r ${getGradientColor()}`}
          style={{ ...baseSize, borderImage: 'none' }}
        />
      )}

      {type === "bars" && (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-2 rounded-full bg-gradient-to-t ${getGradientColor()} animate-bounce`}
              style={{
                height: size / 2,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
      )}

      {type === "pulse" && (
        <div
          className={`rounded-full animate-ping opacity-70 bg-gradient-to-r ${getGradientColor()}`}
          style={baseSize}
        />
      )}

      {type === "spinner" && (
        <div className="relative">
          <div
            className={`rounded-full border-4 border-gray-200 dark:border-gray-700 ${isDarkMode ? 'opacity-20' : 'opacity-30'}`}
            style={baseSize}
          />
          <div
            className={`absolute top-0 left-0 rounded-full border-4 border-t-transparent animate-spin bg-gradient-to-r ${getGradientColor()}`}
            style={baseSize}
          />
        </div>
      )}
    </div>
  );
}