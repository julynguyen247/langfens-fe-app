"use client";


// Redesigned Analytics page.
// Sections (top → bottom):
//   1. Header band with predicted-band ruler + confidence pill
//   2. KPI strip (4 cards)
//   3. Score trend chart (multi-skill, % axis with band-converted tooltip)
//   4. Skill band breakdown (4 per-skill cards)
//   5. Two-column row: question-type bars + activity heatmap
//   6. AI Study Coach band
//   7. Bottom two-column row: strengths/focus + mistake review

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getAnalyticsSummary,
  getScoreTrend,
  getStrengthsWeaknesses,
  getRecentAnalyticsActivity,
  getGamificationStats,
  getWrongAnswers,
  getRecommendations,
  getAiInsights,
  getPredictedBand,
} from "@/utils/api";
import { ActivityCalendar } from "@/components/ui/ActivityCalendar";
import { EmptyState } from "@/components/ui/EmptyState";

import { BandRuler } from "./_components/BandRuler";
import { StatCard } from "./_components/StatCard";
import { ScoreTrendChart } from "./_components/ScoreTrendChart";
import { SkillBandCard } from "./_components/SkillBandCard";
import { QuestionTypeBars } from "./_components/QuestionTypeBars";
import { MistakeReview } from "./_components/MistakeReview";
import { StrengthsFocus } from "./_components/StrengthsFocus";
import { AiCoachBanner } from "./_components/AiCoachBanner";
import { SkeletonAnalytics } from "./_components/SkeletonAnalytics";
import {
  bandDescriptor,
  formatBand,
  percentToBand,
  type ActivityDay,
  type AiInsight,
  type PredictedBandData,
  type Recommendation,
  type StrengthsWeaknesses,
  type TrendSeries,
  type WrongAnswer,
  parseActivity,
  parseAiInsights,
  parseGamification,
  parsePredicted,
  parseRecommendations,
  parseStrengths,
  parseSummary,
  parseTrend,
  parseWrongAnswers,
  type AnalyticsSummary,
} from "./_lib/utils";

// ---------------------------------------------------------------------------
// Card style
// ---------------------------------------------------------------------------

const CARD_CLASS =
  "bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 sm:p-6";

// ---------------------------------------------------------------------------
// Min-load delay so the skeleton is visible even on fast connections.
// ---------------------------------------------------------------------------

const MIN_LOADING_MS = 350;

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<TrendSeries[]>([]);
  const [strengths, setStrengths] = useState<StrengthsWeaknesses>({
    strengths: [],
    weaknesses: [],
  });
  const [streak, setStreak] = useState<number | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<{
    items: WrongAnswer[];
    total: number;
  }>({ items: [], total: 0 });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [predicted, setPredicted] = useState<PredictedBandData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const startedAt = Date.now();
      try {
        const [
          summaryRes,
          trendRes,
          strengthsRes,
          gamificationRes,
          errorsRes,
          recommendationsRes,
          insightsRes,
          activityRes,
          predictedRes,
        ] = await Promise.all([
          getAnalyticsSummary().catch(() => null),
          getScoreTrend(30).catch(() => null),
          getStrengthsWeaknesses().catch(() => null),
          getGamificationStats().catch(() => null),
          getWrongAnswers({ pageSize: 5 }).catch(() => null),
          getRecommendations(5).catch(() => null),
          getAiInsights().catch(() => null),
          getRecentAnalyticsActivity(90).catch(() => null),
          getPredictedBand().catch(() => null),
        ]);

        if (cancelled) return;

        setSummary(parseSummary(summaryRes));
        setTrend(parseTrend(trendRes));
        setStrengths(parseStrengths(strengthsRes));
        const gam = parseGamification(gamificationRes);
        setStreak(gam.currentStreak);
        setWrongAnswers(parseWrongAnswers(errorsRes));
        setRecommendations(parseRecommendations(recommendationsRes));
        setInsights(parseAiInsights(insightsRes));
        setActivity(parseActivity(activityRes));
        setPredicted(parsePredicted(predictedRes));
      } catch (e) {
        // Errors fall through to the empty state (totalAttempts === 0 → CTA)
        console.error("Failed to load analytics:", e);
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        if (remaining > 0) {
          setTimeout(() => {
            if (!cancelled) setLoading(false);
          }, remaining);
        } else {
          if (!cancelled) setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--background)]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonAnalytics />
        </main>
      </div>
    );
  }

  if (!summary || !summary.totalAttempts) {
    return (
      <div className="min-h-screen w-full bg-[var(--background)]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={CARD_CLASS}
          >
            <EmptyState
              title="Complete a test to unlock your analytics"
              subtitle="Take a practice test and come back here to see your personalised insights dashboard."
              ctaText="Take a test"
              ctaHref="/practice"
            />
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[var(--background)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <HeaderBand predicted={predicted} streak={streak} />
        <KpiStrip summary={summary} trend={trend} streak={streak} />
        <ScoreTrendSection trend={trend} />
        <SkillBreakdown summary={summary} />
        <TwoColPerformance
          strengths={strengths}
          activity={activity}
        />
        <AiCoachBanner
          recommendations={recommendations}
          insights={insights}
        />
        <BottomRow
          strengths={strengths}
          wrongAnswers={wrongAnswers}
        />
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Header band — title + predicted band ruler + confidence pill.
// ---------------------------------------------------------------------------

function HeaderBand({
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

// ---------------------------------------------------------------------------
// 2. KPI strip.
// ---------------------------------------------------------------------------

function KpiStrip({
  summary,
  trend,
  streak: _streak,
}: {
  summary: AnalyticsSummary;
  trend: TrendSeries[];
  streak: number | null;
}) {
  // Average band is derived from `summary.avgScore` (percent) via percentToBand.
  const avgBandPct = summary.avgScore;
  const avgBand =
    avgBandPct != null && Number.isFinite(avgBandPct)
      ? percentToBand(avgBandPct)
      : null;

  // Best band is derived from the trend max (percent) so it tracks recent runs.
  let bestPct: number | null = null;
  for (const series of trend) {
    for (const p of series.points) {
      if (Number.isFinite(p.avgScore)) {
        if (bestPct == null || p.avgScore > bestPct) bestPct = p.avgScore;
      }
    }
  }
  const bestBand =
    bestPct != null ? percentToBand(bestPct) : avgBand;

  // Tests this week — count from trend points in the last 7 days.
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let testsThisWeek = 0;
  for (const series of trend) {
    for (const p of series.points) {
      const t = new Date(p.date).getTime();
      if (Number.isFinite(t) && t >= cutoff) testsThisWeek += 1;
    }
  }
  if (testsThisWeek === 0) {
    // Fallback: at minimum show the total so the card isn't blank.
    testsThisWeek = summary.totalAttempts ?? 0;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <StatCard
        label="Total attempts"
        value={summary.totalAttempts ?? 0}
        subLabel="Across all skills"
      />
      <StatCard
        label="Average band"
        value={avgBand != null ? formatBand(avgBand) : "—"}
        subLabel={avgBand != null ? bandDescriptor(avgBand) : "Pending"}
      />
      <StatCard
        label="Best band"
        value={bestBand != null ? formatBand(bestBand) : "—"}
        subLabel={bestBand != null ? bandDescriptor(bestBand) : "Pending"}
      />
      <StatCard
        label="Tests this week"
        value={testsThisWeek}
        subLabel="Past 7 days"
      />
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// 3. Score trend section.
// ---------------------------------------------------------------------------

function ScoreTrendSection({ trend }: { trend: TrendSeries[] }) {
  return (
    <section className={CARD_CLASS}>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <h2
          className="text-xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Score trend — last 30 days
        </h2>
        <p
          className="text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Hover for daily values (percent and band).
        </p>
      </div>
      <ScoreTrendChart
        series={trend}
        yMin={0}
        yMax={100}
        yLabel="%"
        formatHoverValue={(v) => {
          const band = percentToBand(v);
          return `${v.toFixed(0)}% (band ${formatBand(band)})`;
        }}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Skill band breakdown.
// ---------------------------------------------------------------------------

function SkillBreakdown({ summary }: { summary: AnalyticsSummary }) {
  const skillScores = summary.skillScores ?? {};
  const testsBySkill = summary.testsBySkill ?? {};

  const skills: SkillBandCardSkill[] = [
    {
      skill: "READING",
      band: numberOrNull(skillScores["reading"]) ?? numberOrNull(skillScores["Reading"]),
      accuracy: skillBandAccuracy(skillScores, "reading"),
      testCount: numberOrNull(testsBySkill["reading"]) ?? numberOrNull(testsBySkill["Reading"]) ?? 0,
    },
    {
      skill: "LISTENING",
      band:
        numberOrNull(skillScores["listening"]) ??
        numberOrNull(skillScores["Listening"]),
      accuracy: skillBandAccuracy(skillScores, "listening"),
      testCount:
        numberOrNull(testsBySkill["listening"]) ??
        numberOrNull(testsBySkill["Listening"]) ??
        0,
    },
    {
      skill: "WRITING",
      band:
        numberOrNull(skillScores["writing"]) ?? numberOrNull(skillScores["Writing"]),
      accuracy: skillBandAccuracy(skillScores, "writing"),
      testCount:
        numberOrNull(testsBySkill["writing"]) ??
        numberOrNull(testsBySkill["Writing"]) ??
        0,
    },
    {
      skill: "SPEAKING",
      band:
        numberOrNull(skillScores["speaking"]) ??
        numberOrNull(skillScores["Speaking"]),
      accuracy: skillBandAccuracy(skillScores, "speaking"),
      testCount:
        numberOrNull(testsBySkill["speaking"]) ??
        numberOrNull(testsBySkill["Speaking"]) ??
        0,
    },
  ];

  return (
    <section className={CARD_CLASS}>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2
            className="text-xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Skill band breakdown
          </h2>
          <p
            className="text-xs text-[var(--text-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your estimated IELTS band per skill.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {skills.map((s) => (
          <SkillBandCard
            key={s.skill}
            skill={s.skill}
            band={s.band}
            accuracy={s.accuracy}
            testCount={s.testCount}
          />
        ))}
      </div>
    </section>
  );
}

interface SkillBandCardSkill {
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  band: number | null;
  accuracy: number | null;
  testCount: number;
}

function numberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/**
 * Pull an accuracy figure for a given skill. The backend sometimes returns
 * per-skill accuracy nested under `skillScores.<skill>.accuracy`, sometimes as
 * a flat band, and sometimes not at all — fall back to "—" gracefully.
 */
function skillBandAccuracy(
  skillScores: Record<string, number>,
  key: string,
): number | null {
  const direct = (skillScores as Record<string, unknown>)[key];
  if (direct && typeof direct === "object") {
    const acc = (direct as Record<string, unknown>)["accuracy"];
    if (typeof acc === "number" && Number.isFinite(acc)) return acc;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 5. Two-column row: question-type bars + activity heatmap.
// ---------------------------------------------------------------------------

function TwoColPerformance({
  strengths,
  activity,
}: {
  strengths: StrengthsWeaknesses;
  activity: ActivityDay[];
}) {
  const items = [...strengths.strengths, ...strengths.weaknesses];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className={CARD_CLASS}
      >
        <div className="mb-4">
          <h2
            className="text-xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Question type performance
          </h2>
          <p
            className="text-xs text-[var(--text-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Accuracy by question type, grouped by skill.
          </p>
        </div>
        <QuestionTypeBars items={items} />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
        className={CARD_CLASS}
      >
        <div className="mb-4">
          <h2
            className="text-xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Activity heatmap
          </h2>
          <p
            className="text-xs text-[var(--text-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your daily practice activity.
          </p>
        </div>
        <ActivityCalendar compact={false} days={activity} />
        <div className="flex items-center gap-2 mt-4 text-xs text-[var(--text-muted)]">
          <span style={{ fontFamily: "var(--font-heading)" }}>Less</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((opacity) => (
            <span
              key={opacity}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  opacity === 0
                    ? "var(--border)"
                    : `color-mix(in srgb, var(--primary) ${opacity * 100}%, transparent)`,
              }}
            />
          ))}
          <span style={{ fontFamily: "var(--font-heading)" }}>More</span>
        </div>
      </motion.section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. Bottom two-column row: strengths/focus + mistake review.
// ---------------------------------------------------------------------------

function BottomRow({
  strengths,
  wrongAnswers,
}: {
  strengths: StrengthsWeaknesses;
  wrongAnswers: { items: WrongAnswer[]; total: number };
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className={CARD_CLASS}
      >
        <StrengthsFocus
          strengths={strengths.strengths}
          weaknesses={strengths.weaknesses}
        />
      </motion.section>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
        className={CARD_CLASS}
      >
        <MistakeReview
          errors={wrongAnswers.items}
          total={wrongAnswers.total}
          max={5}
        />
      </motion.section>
    </div>
  );
}

