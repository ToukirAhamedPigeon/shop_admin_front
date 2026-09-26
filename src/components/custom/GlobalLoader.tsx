import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

// Full-screen blocking loader. Colors come from theme tokens so it always
// matches the active palette; the slice's color fields are no longer used.
export default function GlobalLoader(): React.ReactElement | null {
  const { visible, message } = useSelector((state: RootState) => state.loader);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="flex flex-col items-center gap-5">
        <img
          src="/logo.png"
          alt=""
          width={48}
          height={48}
          className="select-none pointer-events-none object-contain"
        />

        <div className="size-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />

        {message && (
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
