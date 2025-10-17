export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-indigo-100">
      <div
        className="h-2 rounded-full bg-indigo-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
