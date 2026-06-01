'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { diffWords } from '@/lib/wordDiff';

export type WordDiffSide = 'left' | 'right' | 'inline';

interface Props {
  original: string;
  improved: string;
  side: WordDiffSide;
  className?: string;
}

const REMOVED_CLASS = 'underline decoration-2 decoration-[var(--destructive)]/70 underline-offset-2 line-through text-[var(--destructive)] opacity-80';
const ADDED_CLASS = 'underline decoration-2 decoration-emerald-600/80 underline-offset-2 text-emerald-700 font-semibold';

export function WordDiff({ original, improved, side, className }: Props) {
  const tokens = useMemo(() => diffWords(original, improved), [original, improved]);

  if (tokens.length === 0) {
    return <span className={className} />;
  }

  return (
    <span className={cn('break-words', className)}>
      {tokens.map((token, i) => {
        if (token.type === 'equal') {
          return <span key={i}>{token.text}</span>;
        }
        if (token.type === 'removed') {
          if (side === 'right') {
            return null;
          }
          return (
            <span key={i} className={REMOVED_CLASS}>
              {token.text}
            </span>
          );
        }
        if (side === 'left') {
          return null;
        }
        return (
          <span key={i} className={ADDED_CLASS}>
            {token.text}
          </span>
        );
      })}
    </span>
  );
}
