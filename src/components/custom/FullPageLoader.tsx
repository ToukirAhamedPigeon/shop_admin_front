import React from "react";
import { useAppSelector } from "@/hooks/useRedux";

interface FullPageLoaderProps {
  showLogo?: boolean;           // default false
  showAppName?: boolean;        // default false
  slogan?: string;              // default "Loading..."
  bgImage?: string;             // default "/login-bg.jpg"
  gradientFrom?: string;        // default "#141e30"
  gradientTo?: string;          // default "#243b55"
  darkBgImage?: string;         // default "/login-bg-dark.jpg"
  darkGradientFrom?: string;    // default "#0f1a2a"
  darkGradientTo?: string;      // default "#1b2a3f"
}

export default function FullPageLoader({
  showLogo = false,
  showAppName = false,
  slogan = "Loading...",
  bgImage = "/login-bg.jpg",
  gradientFrom = "#141e30",
  gradientTo = "#243b55",
  darkBgImage = "/login-bg-dark.jpg",
  darkGradientFrom = "#0f1a2a",
  darkGradientTo = "#1b2a3f",
}: FullPageLoaderProps) {
  const { current: theme } = useAppSelector((state) => state.theme);

  const isDark = theme === "dark";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${isDark ? darkBgImage : bgImage})`,
      }}
    >
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(to bottom right, ${
            isDark ? `${darkGradientFrom}E6, ${darkGradientTo}E6` : `${gradientFrom}E6, ${gradientTo}E6`
          })`,
        }}
      />

      {/* Loader Content */}
      <div className="relative z-10 text-center flex flex-col items-center">
        {showLogo && (
          <img
            src="/logo.png"
            alt="App Logo"
            className="w-20 h-20 mb-4 animate-bounce"
          />
        )}

        {showAppName && (
          <h1 className="text-3xl font-bold text-white tracking-wide mb-2">
            Shop Admin
          </h1>
        )}

        <p className="text-gray-200 text-lg">{slogan}</p>

        {/* Spinner */}
        <div className="mt-6 w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
