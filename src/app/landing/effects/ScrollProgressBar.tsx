"use client";

interface ScrollProgressBarProps {
  progress: number;
}

/**
 * Thin progress bar fixed at the top of the viewport.
 * Width scales with scroll progress.
 */
export default function ScrollProgressBar({ progress }: ScrollProgressBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[101] h-[3px]">
      <div
        className="h-full transition-[width] duration-100 ease-linear"
        style={{
          width: `${progress * 100}%`,
          background: "var(--ocean-primary)",
          boxShadow: "0 0 8px rgba(14, 165, 233, 0.4)",
        }}
      />
    </div>
  );
}
