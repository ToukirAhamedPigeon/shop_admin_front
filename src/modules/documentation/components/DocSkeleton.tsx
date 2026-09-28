// src/modules/documentation/components/DocSkeleton.tsx
// Placeholders shaped like the content, so loading doesn't flash a spinner.

export function DocPageSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden>
      <div className="flex items-center justify-between gap-4">
        <div className="h-6 w-1/3 rounded-md bg-muted" />
        <div className="h-3.5 w-32 rounded bg-muted" />
      </div>
      <div className="space-y-2.5">
        {[96, 100, 88, 72].map((w, i) => (
          <div key={i} className="h-3.5 rounded bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="h-48 rounded-lg bg-muted/70" />
      <div className="space-y-2.5">
        <div className="h-5 w-1/4 rounded bg-muted" />
        {[92, 84, 60].map((w, i) => (
          <div key={i} className="h-3.5 rounded bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

export function DocTreeSkeleton() {
  return (
    <div className="animate-pulse space-y-1.5 p-1" aria-hidden>
      {[70, 55, 62, 48, 66, 52].map((w, i) => (
        <div key={i} className="flex items-center gap-2 py-1" style={{ paddingLeft: i % 3 === 0 ? 0 : 16 }}>
          <div className="size-4 shrink-0 rounded bg-muted" />
          <div className="h-3.5 rounded bg-muted" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

/** Thin bar along the top of a card while newer content loads behind the current one. */
export function LoadingBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t-xl transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`}
    >
      {active && <div className="doc-loading-bar h-full w-1/3 bg-primary" />}
    </div>
  );
}
