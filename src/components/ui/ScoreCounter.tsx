'use client';

import { useEffect, useState } from 'react';
import { useMotionValue, animate, useReducedMotion } from 'framer-motion';

interface ScoreCounterProps {
  value: number;
  duration?: number; // seconds, default 1.5
  decimals?: number; // decimal places, default 1
  className?: string;
}

export function ScoreCounter({ value, duration = 1.5, decimals = 1, className = '' }: ScoreCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value.toFixed(decimals));
      return;
    }
    const controls = animate(count, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(v.toFixed(decimals)),
    });
    return controls.stop;
  }, [value, duration, decimals, count, prefersReducedMotion]);

  return (
    <span className={className} style={{ fontFamily: 'var(--font-mono)' }}>
      {displayValue}
    </span>
  );
}
