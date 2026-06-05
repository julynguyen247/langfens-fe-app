"use client";

import React, { memo, ReactNode } from "react";

type Props = {
  /** Optional id used as the data-* attribute on the root element
   *  (matches the conventions used by the existing cards so the
   *  parent can scroll to a specific card). */
  id?: string;
  /** Whether to render the notebook page-edge accent on the left. */
  showAccent?: boolean;
  /** Extra className merged with the base wrapper. */
  className?: string;
  /** Inline style merged with the base wrapper. */
  style?: React.CSSProperties;
  /** The status bar to render at the top. Pass `null` to skip. */
  statusBar?: ReactNode;
  /** Body content. */
  children: ReactNode;
};

/**
 * WorkbookCard — the shared "workbook page" frame used by every
 * completion / matching / flow / diagram card. Wraps the card in:
 *   - chunky rounded border (2.5px) with a 3D drop shadow
 *   - the thin notebook page-edge accent (vertical dashed line)
 *   - an optional status bar slot at the top
 *
 * Single source of truth so every reading question looks like it
 * came off the same printed page. Pure presentational — the caller
 * owns all interaction state.
 */
const WorkbookCard = memo(function WorkbookCard({
  id,
  showAccent = true,
  className = "",
  style,
  statusBar,
  children,
}: Props) {
  return (
    <div
      className={`relative rounded-[1.75rem] border-[2.5px] border-[var(--border)] bg-[var(--card)] shadow-[0_4px_0_rgba(0,0,0,0.06)] overflow-hidden ${className}`}
      style={{ fontFamily: "var(--font-body)", ...style }}
      data-workbook-card={id}
    >
      {showAccent && (
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 bottom-0 w-[6px] opacity-70 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--primary) 0 1px, transparent 1px 8px)",
          }}
        />
      )}

      {statusBar}
      {children}
    </div>
  );
});

export default WorkbookCard;
