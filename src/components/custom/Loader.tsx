// src/components/custom/Loader.tsx
interface LoaderProps {
  type?: "circular" | "bars" | "pulse" | "spinner";
  size?: number;
}

export default function Loader({ type = "circular", size = 48 }: LoaderProps) {
  const baseSize = { width: size, height: size };

  return (
    <div className="flex items-center justify-center">
      {type === "circular" && (
        <div
          className="rounded-full border-4 border-muted border-t-primary animate-spin"
          style={baseSize}
        />
      )}

      {type === "bars" && (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 rounded-full bg-primary animate-bounce"
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
          className="rounded-full animate-ping opacity-70 bg-primary"
          style={baseSize}
        />
      )}

      {type === "spinner" && (
        <div className="relative">
          <div
            className="rounded-full border-4 border-muted opacity-30"
            style={baseSize}
          />
          <div
            className="absolute top-0 left-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
            style={baseSize}
          />
        </div>
      )}
    </div>
  );
}