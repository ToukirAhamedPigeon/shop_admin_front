interface LoaderProps {
  type?: "circular" | "bars" | "pulse";
  size?: number; // optional custom size
}

export default function Loader({ type = "circular", size = 48 }: LoaderProps) {
  const baseSize = {
    width: size,
    height: size,
  };

  return (
    <div className="flex items-center justify-center">
      {type === "circular" && (
        <div
          className="rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
          style={baseSize}
        />
      )}

      {type === "bars" && (
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-6 rounded-sm bg-blue-600 animate-[bounce_0.6s_infinite]"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {type === "pulse" && (
        <div
          className="rounded-full border-4 border-blue-600 animate-ping opacity-70"
          style={baseSize}
        />
      )}
    </div>
  );
}
