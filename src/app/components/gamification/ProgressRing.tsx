"use client";

import { useEffect, useRef, useId } from "react";
import gsap from "gsap";

interface ProgressRingProps {
  size?: number;
  progress?: number;
}

export function ProgressRing({ size = 36, progress = 73 }: ProgressRingProps) {
  const id = useId();
  const glowId = `ring-glow-${id}`;
  const clipId = `wave-clip-${id}`;
  const textRef = useRef<SVGTextElement>(null);
  const clipPathRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const rect = clipPathRef.current;
    const text = textRef.current;
    if (!rect || !text) return;

    const obj = { val: 0 };

    const tween = gsap.to(obj, {
      val: progress,
      duration: 2,
      ease: "power2.out",
      delay: 0.5,
      onUpdate: () => {
        const h = (obj.val / 100) * size;
        rect.setAttribute("y", String(size - h));
        rect.setAttribute("height", String(h));
        text.textContent = `${Math.round(obj.val)}%`;
      },
    });

    return () => { tween.kill(); };
  }, [progress, size]);

  const r = (size - 6) / 2;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          <feComposite in="SourceGraphic" />
        </filter>
        <clipPath id={clipId}>
          <rect
            ref={clipPathRef}
            x="0"
            y={String(size)}
            width={String(size)}
            height="0"
          />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00E5FF" strokeWidth="3" clipPath={`url(#${clipId})`} filter={`url(#${glowId})`} />
      <text ref={textRef} x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#00E5FF" fontSize={size * 0.28} fontWeight="700" fontFamily="var(--font-nunito), sans-serif">
        0%
      </text>
    </svg>
  );
}
