'use client';

const SKILL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  READING: {
    bg: 'bg-[var(--skill-reading-light)]',
    text: 'text-[var(--skill-reading)]',
    border: 'border-[var(--skill-reading-border)]',
  },
  LISTENING: {
    bg: 'bg-[var(--skill-listening-light)]',
    text: 'text-[var(--skill-listening)]',
    border: 'border-[var(--skill-listening-border)]',
  },
  WRITING: {
    bg: 'bg-[var(--skill-writing-light)]',
    text: 'text-[var(--skill-writing)]',
    border: 'border-[var(--skill-writing-border)]',
  },
  SPEAKING: {
    bg: 'bg-[var(--skill-speaking-light)]',
    text: 'text-[var(--skill-speaking)]',
    border: 'border-[var(--skill-speaking-border)]',
  },
};

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

interface SkillBadgeProps {
  skill: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkillBadge({ skill, size = 'md', className = '' }: SkillBadgeProps) {
  const style = SKILL_STYLES[skill.toUpperCase()] ?? SKILL_STYLES.READING;
  const sizeClass = SIZES[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border-[2px] font-semibold ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}
    >
      {skill.charAt(0) + skill.slice(1).toLowerCase()}
    </span>
  );
}
