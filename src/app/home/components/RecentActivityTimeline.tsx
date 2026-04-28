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

interface RecentActivityTimelineProps {
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

export function RecentActivityTimeline({ attempts }: RecentActivityTimelineProps) {
  const router = useRouter();
  const displayAttempts = attempts;

  if (displayAttempts.length === 0) {
    return (
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
        <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Recent Activity</h3>
        <p className="text-sm text-[var(--text-muted)] text-center py-8">
          No activity yet. Start your first test to see your progress here!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Recent Activity</h3>
        <button
          onClick={() => router.push('/history')}
          className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          View All
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-[var(--border)]" />

        <div className="space-y-4">
          {displayAttempts.map((attempt) => {
            return (
              <div
                key={attempt.id}
                className="relative flex items-start gap-4 flex-row"
              >
                {/* Timeline dot */}
                <div className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-white border-[3px] border-[var(--primary)] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
                </div>

                {/* Content card */}
                <button
                  onClick={() => router.push(attempt.href)}
                  className="flex-1 flex items-center gap-3 p-4 rounded-[2rem] border-[3px] border-[var(--border)] bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] text-left transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)]"
                >
                  <SkillBadge skill={attempt.skill} size="sm" />
                  <span className="flex-1 text-sm font-semibold text-[var(--foreground)] truncate">
                    {attempt.title}
                  </span>
                  {attempt.score !== undefined && (
                    <span
                      className="text-sm font-bold text-[var(--primary)] shrink-0"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {attempt.score}%
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-muted)] shrink-0">
                    {timeAgo(attempt.dateISO)}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
