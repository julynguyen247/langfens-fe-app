'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { diffWords, type DiffToken } from '@/lib/wordDiff';

export type WordDiffSide = 'left' | 'right' | 'inline';

interface Props {
  original: string;
  improved: string;
  side: WordDiffSide;
  className?: string;
}

const REMOVED_CLASS = 'underline decoration-2 decoration-[var(--destructive)]/70 underline-offset-2 line-through text-[var(--destructive)] opacity-80';
const ADDED_CLASS = 'underline decoration-2 decoration-emerald-600/80 underline-offset-2 text-emerald-700 font-semibold';

type Segment = { kind: 'equal'; text: string } | { kind: 'diff'; type: 'removed' | 'added'; text: string };

function groupTokens(tokens: DiffToken[]): Segment[] {
  const segments: Segment[] = [];
  for (const token of tokens) {
    if (token.type === 'equal') {
      const last = segments[segments.length - 1];
      if (last && last.kind === 'equal') {
        last.text += token.text;
      } else {
        segments.push({ kind: 'equal', text: token.text });
      }
      continue;
    }
    const last = segments[segments.length - 1];
    if (last && last.kind === 'diff' && last.type === token.type) {
      last.text += token.text;
    } else {
      segments.push({ kind: 'diff', type: token.type, text: token.text });
    }
  }
  return segments;
}

export function WordDiff({ original, improved, side, className }: Props) {
  const segments = useMemo(
    () => groupTokens(diffWords(original, improved)),
    [original, improved],
  );

  if (segments.length === 0) {
    return <span className={className} />;
  }

  return (
    <span
      className={cn('break-words', className)}
      // [box-decoration-break: clone] ensures the underline + line-through draw
      // as a single continuous decoration across the whole diff segment, even
      // when adjacent same-type tokens would otherwise render multiple
      // overlapping decorations on the same baseline.
      style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
    >
      {segments.map((seg, i) => {
        if (seg.kind === 'equal') {
          return <span key={i}>{seg.text}</span>;
        }
        if (seg.type === 'removed') {
          if (side === 'right') return null;
          return (
            <span key={i} className={REMOVED_CLASS}>
              {seg.text}
            </span>
          );
        }
        if (side === 'left') return null;
        return (
          <span key={i} className={ADDED_CLASS}>
            {seg.text}
          </span>
        );
      })}
    </span>
  );
}
