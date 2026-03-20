import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

export function EmptyState({ title, subtitle, ctaText, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <h3 className="text-xl font-bold text-[var(--text-heading)] mb-2">{title}</h3>
      {subtitle && (
        <p className="text-[var(--text-muted)] mb-6 max-w-md">{subtitle}</p>
      )}
      {ctaText && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center px-8 py-3 rounded-full font-semibold text-white bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        >
          {ctaText}
        </Link>
      )}
    </div>
  );
}
