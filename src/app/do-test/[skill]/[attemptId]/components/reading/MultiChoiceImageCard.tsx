"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { letterForIndex } from "../common/letters";

type Choice = { value: string; label: string };

type Props = {
  id: string;
  stem: string;
  selected?: string;
  onSelect?: (id: string, value: string) => void;
  /** Choices forwarded from the registry. */
  forices?: Choice[];
};

const IMG_MD_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;

const markdownComponents = {
  p: ({ node, ...props }: any) => (
    <span className="whitespace-pre-wrap" {...props} />
  ),
};

/**
 * MULTIPLE_CHOICE_SINGLE_IMAGE — same letter-tile picker as
 * QuestionCard but with a prominent image at the top of the card.
 *
 * The image is sourced from the prompt (markdown image or bare URL).
 * If the prompt has no image we silently fall back to a normal
 * QuestionCard-style card (no broken placeholder).
 */
const MultiChoiceImageCard = memo(function MultiChoiceImageCard({
  id,
  stem,
  selected,
  onSelect,
  forices,
}: Props) {
  const { imageUrl, imageAlt, instruction } = useMemo(() => {
    const text = stem.replace(/\\n/g, "\n");

    let imgUrl = "";
    let imgAlt = "Question image";
    const imgMatch = text.match(IMG_MD_RE);
    if (imgMatch) {
      imgUrl = imgMatch[2];
      imgAlt = imgMatch[1] || "Question image";
    } else {
      const urlMatch = text.match(/^\s*(https?:\/\/\S+)\s*$/m);
      if (urlMatch) imgUrl = urlMatch[1];
    }

    let instr = text;
    if (imgMatch && imgMatch.index !== undefined) {
      instr = text.slice(0, imgMatch.index);
    }
    instr = instr.replace(IMG_MD_RE, "").trim();

    return { imageUrl: imgUrl, imageAlt: imgAlt, instruction: instr };
  }, [stem]);

  return (
    <div
      className="relative rounded-[2rem] bg-white border-[3px] border-[var(--border)]
                  p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
      data-multi-choice-image-id={id}
    >
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 rounded-[1.25rem] border-[2px] border-[var(--border)] bg-[var(--background)] p-3"
        >
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto max-h-[420px] object-contain rounded-xl bg-white"
            loading="lazy"
          />
        </motion.div>
      )}

      {instruction && (
        <div
          className="font-medium text-[var(--foreground)] mb-4 leading-relaxed text-[15px]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <ReactMarkdown components={markdownComponents}>
            {instruction}
          </ReactMarkdown>
        </div>
      )}

      <MultiChoiceImageChoices
        questionId={id}
        choices={forices}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );
});

/**
 * Letter-tile picker, factored out so the registry can pass the
 * `forices` prop in directly (it's a sibling of the other props).
 */
const MultiChoiceImageChoices = memo(function MultiChoiceImageChoices({
  questionId,
  choices,
  selected,
  onSelect,
}: {
  questionId: string;
  choices?: Choice[];
  selected?: string;
  onSelect?: (id: string, value: string) => void;
}) {
  if (!choices || choices.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {choices.map((c, idx) => {
        const isActive = selected === c.value;
        const letter = letterForIndex(idx);
        return (
          <motion.button
            key={c.value}
            type="button"
            onClick={() => onSelect?.(questionId, c.value)}
            whileTap={{ scale: 0.985 }}
            aria-pressed={isActive}
            className={[
              "group w-full text-left rounded-2xl border-[3px] border-b-[5px]",
              "px-4 py-3 flex items-center gap-3.5",
              "transition-all duration-150",
              isActive
                ? "bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary-dark)]"
                : "bg-white border-[var(--border)] text-[var(--text-body)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/30 hover:-translate-y-0.5",
            ].join(" ")}
            style={{ fontFamily: "var(--font-body)" }}
          >
            <span
              className={[
                "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border-b-[3px]",
                "transition-all duration-150",
                isActive
                  ? "bg-[var(--primary)] text-white border-[var(--primary-dark)]"
                  : "bg-white text-[var(--primary)] border-[var(--primary-light)] group-hover:bg-[var(--primary-light)]",
              ].join(" ")}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {isActive ? "✓" : letter}
            </span>
            <span
              className={[
                "flex-1 text-[15px] leading-snug",
                isActive ? "font-semibold" : "font-medium",
              ].join(" ")}
            >
              <ReactMarkdown components={markdownComponents}>
                {c.label}
              </ReactMarkdown>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
});

export default MultiChoiceImageCard;
