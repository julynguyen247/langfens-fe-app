export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full rounded-full bg-[var(--primary-light)] border-[2px] border-[var(--border)] shadow-[0_2px_0_rgba(0,0,0,0.04)]">
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
