"use client";

import { cn } from "@/lib/utils";
import { StepVisual } from "./step-visuals";

interface StepCardProps {
  step: { number: string; title: string; description: string };
  className?: string;
  accentColor?: string;
}

export default function StepCard({ step, className, accentColor }: StepCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border-[3px] border-[rgba(255,255,255,0.07)] bg-[var(--ocean-bg-light)] p-8 shadow-[0_5px_0_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-150 hover:-translate-y-[3px] hover:scale-[1.01] hover:border-[var(--ocean-border-glow)] hover:shadow-[0_7px_0_rgba(0,0,0,0.35),0_0_25px_var(--ocean-primary-glow)] lg:p-10",
        className
      )}
    >
      {/* Watermark number */}
      <span className="absolute right-6 top-4 text-[120px] font-bold leading-none bg-gradient-to-br from-[#2563EB] to-[#06D6A0] bg-clip-text text-transparent opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500 select-none" style={{ fontFamily: 'var(--font-heading)' }}>
        {step.number}
      </span>

      {/* Corner glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--ocean-primary)]/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      {/* Visual container with pseudo-3D depth */}
      <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-[var(--ocean-border)]/50 shadow-[inset_0_0_30px_rgba(37,99,235,0.05)] group-hover:shadow-[inset_0_0_40px_rgba(37,99,235,0.08)]"
        style={{
          perspective: "600px",
          background: "linear-gradient(135deg, rgba(37,99,235,0.03), rgba(6,214,160,0.02))",
          backdropFilter: "blur(1px)",
        }}
      >
        <div style={{ transform: "rotateY(1deg) rotateX(-0.5deg)", transformStyle: "preserve-3d" }} className="w-full h-full">
          <StepVisual stepNumber={step.number} />
        </div>
      </div>

      {/* Step label */}
      <span
        className="mb-2 block text-sm font-semibold tracking-wide"
        style={{ fontFamily: 'var(--font-heading)', color: accentColor ?? 'var(--ocean-primary)' }}
      >
        Step {step.number}
      </span>

      {/* Title */}
      <h3 className="text-2xl font-bold text-[var(--ocean-text)] transition-colors duration-300 group-hover:text-[var(--ocean-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
        {step.title}
      </h3>

      {/* Description */}
      <p className="mt-3 text-base leading-relaxed text-[var(--ocean-text-secondary)]">
        {step.description}
      </p>
    </div>
  );
}
