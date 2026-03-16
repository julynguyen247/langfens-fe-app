import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
  align?: "center" | "left";
}

export function SectionHeading({
  label,
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-16 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {label && (
        <p className="mb-4 font-code text-xs uppercase tracking-[0.2em] text-[var(--ocean-primary)]">
          {label}
        </p>
      )}
      <h2 className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.1] text-[var(--ocean-text)]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-6 text-lg leading-relaxed text-[var(--ocean-text-secondary)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
