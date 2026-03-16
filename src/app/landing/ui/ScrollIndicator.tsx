"use client";

export function ScrollIndicator() {
  return (
    <div className="flex flex-col items-center gap-2 opacity-60">
      <span className="font-code text-[10px] uppercase tracking-[0.3em] text-[var(--ocean-text-muted)]">
        Scroll to dive deeper
      </span>
      <div
        className="w-px h-8 bg-gradient-to-b from-[var(--ocean-primary)] to-transparent"
        style={{ animation: "scroll-bounce 2s ease-in-out infinite" }}
      />
    </div>
  );
}
