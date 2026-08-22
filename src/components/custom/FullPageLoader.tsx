interface FullPageLoaderProps {
  message?: string;
  type?: "circular" | "bars" | "pulse"; // multiple loader types
}

export default function FullPageLoader({
  message,
  type = "circular",
}: FullPageLoaderProps) {
  const colorClass = "bg-primary border-primary";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80">
      {/* Loader Type Switch */}
      {type === "circular" && (
        <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
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
        <div className="w-12 h-12 rounded-full border-4 border-primary opacity-70 animate-ping" />
      )}

      {/* Optional Message */}
      {message && (
        <p className="mt-4 text-lg font-medium text-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
