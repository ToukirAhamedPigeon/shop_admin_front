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
          className="rounded-full border-[3px] border-primary/15 border-t-primary animate-spin"
          style={baseSize}
        />
      )}

      {type === "bars" && (
        <div
          role="status"
          aria-label="Loading"
          className="rounded-full border-[3px] border-primary/15 border-t-primary animate-spin"
          style={{ width: size * 0.66, height: size * 0.66 }}
        />
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