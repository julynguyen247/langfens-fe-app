"use client";

import React, { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import QuestionStatusBar from "../common/QuestionStatusBar";
import WorkbookCard from "../common/WorkbookCard";
import WorkbookInput from "../common/WorkbookInput";

type Props = {
  id: string;
  stem: string;
  /** Image URL for the map (from DTO imageUrl field). Takes precedence over regex on stem. */
  imageUrl?: string | null;
  /** One slot per part. Falls back to a single slot if no parts are declared. */
  values: string[];
  onChange: (blankIndex: number, value: string) => void;
  /** 1-based starting number for the first sub-question. */
  startIdx?: number;
  /** Optional label shown in the card's status bar. */
  rangeLabel?: string;
  /** Whether the group is flagged for review. */
  isFlagged?: boolean;
  /** Toggle the group's flagged state. */
  onToggleFlag?: () => void;
};

const IMG_MD_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const PART_RE = /\[Map:\s*([^\]]+?)\s*\]/i;

/**
 * MAP_LABEL — same idea as DIAGRAM_LABEL but specialised for maps.
 *
 * Renders a real map image (when the prompt carries one) above a
 * numbered list of letter-inputs. Falls back to a single input if
 * the prompt doesn't expose a part list.
 */
const MapLabelCard = memo(function MapLabelCard({
  id,
  stem,
  imageUrl: imageUrlProp,
  values,
  startIdx,
  onChange,
  rangeLabel,
  isFlagged = false,
  onToggleFlag,
}: Props) {
  const { instruction, imageUrl, imageAlt, parts } = useMemo(() => {
    const text = stem.replace(/\\n/g, "\n");

    let imgUrl = imageUrlProp ?? "";
    let imgAlt = "Map";
    if (!imgUrl) {
      const imgMatch = text.match(IMG_MD_RE);
      if (imgMatch) {
        imgUrl = imgMatch[2];
        imgAlt = imgMatch[1] || "Map";
      } else {
        const urlMatch = text.match(/^\s*(https?:\/\/\S+)\s*$/m);
        if (urlMatch) imgUrl = urlMatch[1];
      }
    }

    const partMatch = text.match(PART_RE);
    const partNames: string[] = partMatch
      ? partMatch[1]
          .split(/,\s*/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    let instr = text;
    if (partMatch && partMatch.index !== undefined) {
      instr = text.slice(0, partMatch.index);
    } else if (!imgUrl) {
      // regex-extracted from stem above
      const stemImgMatch = text.match(IMG_MD_RE);
      if (stemImgMatch && stemImgMatch.index !== undefined) {
        instr = text.slice(0, stemImgMatch.index);
      }
    }
    instr = instr.replace(IMG_MD_RE, "").trim();

    const base = startIdx ?? 1;
    const built = partNames.map((name, i) => ({ name, number: base + i }));
    if (built.length === 0) {
      built.push({ name: "", number: base });
    }

    return { instruction: instr, imageUrl: imgUrl, imageAlt: imgAlt, parts: built };
  }, [imageUrlProp, stem, startIdx]);

  const totalBlanks = parts.length;
  const answeredBlanks = values.filter(
    (v) => (v ?? "").trim().length > 0
  ).length;
  const showStatusBar = !!rangeLabel || totalBlanks > 0 || !!onToggleFlag;

  return (
    <WorkbookCard
      id={id}
      statusBar={
        showStatusBar ? (
          <QuestionStatusBar
            rangeLabel={rangeLabel}
            answeredCount={answeredBlanks}
            totalCount={totalBlanks}
            isFlagged={isFlagged}
            onToggleFlag={onToggleFlag}
          />
        ) : null
      }
    >
      {instruction && (
        <p
          className="px-4 sm:px-5 pt-3 pb-2 text-[14px] font-semibold text-[var(--foreground)] leading-relaxed"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {instruction}
        </p>
      )}

      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-4 sm:mx-5 my-3 rounded-[1.25rem] border-[2px] border-[var(--border)] bg-white p-3"
        >
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto max-h-[420px] object-contain rounded-xl bg-[var(--background)]"
            loading="lazy"
          />
        </motion.div>
      )}

      <div className="px-4 sm:px-5 pb-4 space-y-2.5">
        {parts.map((p, idx) => (
          <motion.div
            key={p.number}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
          >
            <WorkbookInput
              numberLabel={p.number}
              partLabel={p.name || undefined}
              value={values[idx] ?? ""}
              onChange={(v) => onChange(idx, v)}
              placeholder="Type your answer here"
              ariaLabel={`Map part ${p.name || p.number}`}
              showTypeHint
              showAnsweredBadge
            />
          </motion.div>
        ))}
      </div>
    </WorkbookCard>
  );
});

export default MapLabelCard;
