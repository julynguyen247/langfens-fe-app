'use client';

import { useRouter } from 'next/navigation';
import { SkillBadge } from '@/components/ui/SkillBadge';

interface RecentAttempt {
  id: string;
  title: string;
  skill: string;
  dateISO: string;
  score?: number;
  href: string;
}

interface RecentActivityProps {
  attempts: RecentAttempt[];
}

function timeAgo(dateISO: string): string {
  const now = Date.now();
  const then = new Date(dateISO).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

export function RecentActivity({ attempts }: RecentActivityProps) {
  const router = useRouter();

  if (attempts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Recent Activity</h3>
        <button
          onClick={() => router.push('/history')}
          className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-2">
        {attempts.slice(0, 4).map((attempt) => (
          <button
            key={attempt.id}
            onClick={() => router.push(attempt.href)}
            className="w-full flex items-center gap-3 p-4 rounded-[2rem] border-[3px] border-[var(--border)] bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] text-left transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)]"
          >
            <SkillBadge skill={attempt.skill} size="sm" />
            <span className="flex-1 text-sm font-semibold text-[var(--foreground)] truncate">
              {attempt.title}
            </span>
            {attempt.score !== undefined && (
              <span
                className="text-sm font-bold text-[var(--primary)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {attempt.score}%
              </span>
            )}
            <span className="text-xs text-[var(--text-muted)] shrink-0">
              {timeAgo(attempt.dateISO)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
