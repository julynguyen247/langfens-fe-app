export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border-[2px] border-[var(--primary)] border-t-transparent rounded-full animate-spin w-5 h-5 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}