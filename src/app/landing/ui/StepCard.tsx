"use client";

import { cn } from "@/lib/utils";
import { StepVisual } from "./step-visuals";

interface StepCardProps {
  step: { number: string; title: string; description: string };
  className?: string;
  accentColor?: string;
}

import { GlassCard } from "./GlassCard";

export default function StepCard({ step, className, accentColor }: StepCardProps) {
  return (
    <GlassCard className={cn("group p-8 lg:p-10", className)} glowColor={accentColor ?? "rgba(59, 130, 246, 0.2)"}>
      {/* Watermark number */}
      <span className="absolute right-6 top-4 text-[120px] font-bold leading-none bg-gradient-to-br from-[#2563EB] to-[#06D6A0] bg-clip-text text-transparent opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500 select-none" style={{ fontFamily: 'var(--font-heading)' }}>
        {step.number}
      </span>

      {/* Visual container with pseudo-3D depth */}
      <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/10 shadow-inner group-hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.05)]"
        style={{
          perspective: "600px",
          background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ transform: "rotateY(2deg) rotateX(-1deg)", transformStyle: "preserve-3d" }} className="w-full h-full transition-transform duration-500 group-hover:rotate-y-0 group-hover:rotate-x-0">
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
      <h3 className="text-2xl font-bold text-[var(--ocean-text)] transition-colors duration-300 group-hover:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
        {step.title}
      </h3>

      {/* Description */}
      <p className="mt-3 text-base leading-relaxed text-[var(--ocean-text-secondary)] group-hover:text-white/80 transition-colors duration-300">
        {step.description}
      </p>
    </GlassCard>
  );
}
