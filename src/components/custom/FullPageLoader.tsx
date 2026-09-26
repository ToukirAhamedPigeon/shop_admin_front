interface FullPageLoaderProps {
  message?: string;
  type?: "circular" | "bars" | "pulse"; // multiple loader types
}

export default function FullPageLoader({
  message,
  type = "circular",
}: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80">
      {/* Loader Type Switch */}
      {type === "circular" && (
        <div className="size-8 rounded-full border-[3px] border-primary/15 border-t-primary animate-spin" />
      )}

      {type === "bars" && (
        <div className="size-8 rounded-full border-[3px] border-primary/15 border-t-primary animate-spin" />
      )}

      {type === "pulse" && (
        <div className="w-12 h-12 rounded-full border-4 border-primary opacity-70 animate-ping" />
      )}

      {/* Optional Message */}
      {message && (
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
