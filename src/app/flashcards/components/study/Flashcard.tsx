"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import ReactMarkdown from "react-markdown";

type Card = {
  id: string;
  front: string;
  back: string;
  example?: string;
  hint?: string;
};

export default function Flashcard({
  card,
  flipped,
  onFlip,
}: {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
}) {
  const [anim, setAnim] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  /* Swipe state */
  const x = useMotionValue(0);
  const rotateZ = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const bgLeft = useTransform(
    x,
    [-200, -80, 0],
    [
      "rgba(239,68,68,0.12)",
      "rgba(239,68,68,0.04)",
      "rgba(0,0,0,0)",
    ]
  );
  const bgRight = useTransform(
    x,
    [0, 80, 200],
    [
      "rgba(0,0,0,0)",
      "rgba(16,185,129,0.04)",
      "rgba(16,185,129,0.12)",
    ]
  );
  const swipeBg = useTransform(
    x,
    (latest) => (latest < 0 ? bgLeft.get() : bgRight.get())
  );
  const leftLabelOpacity = useTransform(x, [-200, -60, 0], [1, 0.5, 0]);
  const rightLabelOpacity = useTransform(x, [0, 60, 200], [0, 0.5, 1]);

  useEffect(() => {
    setAnim(true);
    const t = setTimeout(() => setAnim(false), 200);
    return () => clearTimeout(t);
  }, [card.id]);

  return (
    <div ref={constraintsRef} className="relative mx-auto max-w-2xl">
      {/* Swipe labels */}
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-[var(--destructive)] px-4 py-2 text-sm font-bold text-white pointer-events-none"
        style={{ opacity: leftLabelOpacity }}
      >
        Don&apos;t Know
      </motion.div>
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-[var(--skill-speaking)] px-4 py-2 text-sm font-bold text-white pointer-events-none"
        style={{ opacity: rightLabelOpacity }}
      >
        Know
      </motion.div>

      {/* Card with perspective flip + drag */}
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) < 80) return;
          /* swipe completed -- just flip for now, grading handled externally */
        }}
        style={{ x, rotateZ, backgroundColor: swipeBg }}
        className="rounded-[2rem] [transform-style:preserve-3d]"
      >
        <div
          className="h-[440px] w-full cursor-pointer select-none"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          onClick={onFlip}
        >
          <div
            className={`relative h-full w-full transition-transform duration-[600ms] ${
              anim ? "ring-2 ring-[var(--primary-light)]" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front Face */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-10 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
              }}
            >
              <span
                className="text-xs font-bold tracking-[0.18em] text-[var(--primary)] uppercase"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {card.hint ? card.hint : "Term"}
              </span>

              <div className="w-full flex-1 overflow-y-auto text-center text-[var(--foreground)] flex items-center justify-center">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-4xl sm:text-5xl font-extrabold leading-tight text-[var(--primary-dark)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-3xl sm:text-4xl font-extrabold leading-tight text-[var(--primary-dark)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-2xl sm:text-3xl font-bold leading-tight text-[var(--primary-dark)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-2xl sm:text-3xl font-bold leading-snug text-[var(--primary-dark)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                        {...props}
                      />
                    ),
                  }}
                >
                  {card.front}
                </ReactMarkdown>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                className="mt-2 shrink-0 rounded-full border-b-[4px] border-[var(--primary-dark)] bg-[var(--primary)] px-7 py-2.5
                text-sm font-bold text-white hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Flip Card
              </button>
            </div>

            {/* Back Face */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-10 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <span
                className="text-xs font-bold tracking-[0.18em] text-[var(--primary)] uppercase"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Definition
              </span>

              <div className="w-full flex-1 overflow-y-auto text-center text-[var(--foreground)] flex items-center justify-center">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-3xl sm:text-4xl font-extrabold leading-tight text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-2xl sm:text-3xl font-extrabold leading-tight text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-xl sm:text-2xl font-bold leading-tight text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-lg sm:text-xl font-semibold leading-relaxed text-[var(--text-body)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                        {...props}
                      />
                    ),
                  }}
                >
                  {card.back}
                </ReactMarkdown>
              </div>

              {card.example && (
                <div
                  className="w-full shrink-0 rounded-2xl border-[3px] border-[var(--primary)] bg-[var(--primary-light)] p-4 text-base sm:text-lg text-[var(--text-body)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <span className="block text-xs font-bold tracking-[0.18em] text-[var(--primary-dark)] uppercase mb-1">
                    Example
                  </span>
                  <span className="italic">&ldquo;{card.example}&rdquo;</span>
                </div>
              )}

              {card.hint && !card.example && (
                <div
                  className="shrink-0 rounded-full border-[2px] border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-sm font-bold text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {card.hint}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                className="mt-2 shrink-0 rounded-full border-[3px] border-[var(--border)] border-b-[5px] bg-white px-7 py-2.5
                text-sm font-bold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Flip Back
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
