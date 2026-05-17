export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span
        className="text-xl font-semibold tracking-[0.18em]"
        style={{ color: "var(--color-primary)" }}
      >
        JUTEKS
      </span>
      <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
        Beaulieu International Group
      </span>
    </div>
  );
}
