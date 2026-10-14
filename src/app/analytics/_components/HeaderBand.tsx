"use client";

import { motion } from "framer-motion";
import { BandRuler } from "./BandRuler";
import { formatBand, type PredictedBandData } from "../_lib/utils";

import { CARD_CLASS } from "../_lib/presentation";

// ---------------------------------------------------------------------------
// 1. Header band — title + predicted band ruler + confidence pill.
// ---------------------------------------------------------------------------

export function HeaderBand({
  predicted,
  streak,
}: {
  predicted: PredictedBandData | null;
  streak: number | null;
}) {
  const predictedBand = predicted?.overallBand ?? null;
  const confidence = predicted?.confidence ?? "";
  const sampleSize = predicted?.sampleSize ?? null;
  const confidenceStyle = confidenceTone(confidence);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={CARD_CLASS}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
        <div className="lg:flex-1">
          <h1
            className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Performance Analytics
          </h1>
          <p
            className="text-sm text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Track every skill, every attempt, every band score.
          </p>
          {streak != null && streak > 0 && (
            <p
              className="text-xs mt-2 text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span
                className="font-bold text-[var(--accent-gold)]"
                style={{ fontFamily: "var(--font-code)" }}
              >
                {streak}
              </span>{" "}
              day streak · keep going
            </p>
          )}
        </div>

        <div className="lg:w-[460px] flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <p
              className="text-[11px] font-bold text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Predicted band (IELTS 1.0–9.0)
            </p>
            <div className="flex items-center gap-2">
              {confidence && (
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${confidenceStyle}`}
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {confidence}
                </span>
              )}
              <p
                className="text-sm text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-code)" }}
              >
                {predictedBand != null
                  ? `Predicted band: ${formatBand(predictedBand)}`
                  : "No prediction yet"}
              </p>
            </div>
          </div>
          <BandRuler predictedBand={predictedBand} />
          {sampleSize != null && sampleSize > 0 && (
            <p
              className="text-[11px] text-[var(--text-muted)] mt-0.5"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Based on {sampleSize} recent {sampleSize === 1 ? "attempt" : "attempts"}.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function confidenceTone(confidence: string): string {
  const c = confidence.toLowerCase();
  if (c === "high") {
    return "text-[var(--skill-speaking)] border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)]";
  }
  if (c === "medium") {
    return "text-[var(--accent-gold)] border-[var(--accent-gold-border)] bg-[var(--accent-gold-light)]";
  }
  if (c === "low") {
    return "text-[var(--skill-writing)] border-[var(--skill-writing-border)] bg-[var(--skill-writing-light)]";
  }
  return "text-[var(--text-muted)] border-[var(--border)] bg-[var(--background)]";
}
