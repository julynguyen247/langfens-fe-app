import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className,
  glowColor = "rgba(255, 255, 255, 0.05)",
  hoverEffect = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl",
        hoverEffect && "transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-40"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
