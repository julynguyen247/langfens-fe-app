'use client';

interface ActivityCalendarProps {
  /** Array of { date: string (YYYY-MM-DD), count: number } */
  days: { date: string; count: number }[];
  compact?: boolean; // true = 35-day view, false = full history
}

export function ActivityCalendar({ days, compact = true }: ActivityCalendarProps) {
  const today = new Date();
  const totalDays = compact ? 35 : days.length;
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  // Generate grid of dates going back from today
  const cells: { date: string; count: number; isToday: boolean }[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = days.find((dd) => dd.date === dateStr);
    cells.push({
      date: dateStr,
      count: dayData?.count ?? 0,
      isToday: i === 0,
    });
  }

  const getOpacity = (count: number) => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.2) return 0.2;
    if (ratio <= 0.4) return 0.4;
    if (ratio <= 0.6) return 0.6;
    if (ratio <= 0.8) return 0.8;
    return 1;
  };

  return (
    <div>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.count} activities`}
            className={`w-3 h-3 rounded-full transition-colors ${
              cell.isToday ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''
            }`}
            style={{
              backgroundColor:
                cell.count > 0
                  ? `color-mix(in srgb, var(--primary) ${getOpacity(cell.count) * 100}%, transparent)`
                  : 'var(--border)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
