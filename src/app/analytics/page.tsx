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
  getWrongAnswers,
  getRecommendations,
  getAiInsights,
  getPredictedBand,
} from "@/services/analytics";
import { getGamificationStats } from "@/services/gamification";
import { EmptyState } from "@/components/ui/EmptyState";
import { AiCoachBanner } from "./_components/AiCoachBanner";
import { SkeletonAnalytics } from "./_components/SkeletonAnalytics";
import {
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

import { CARD_CLASS } from "./_lib/presentation";
import { HeaderBand } from "./_components/HeaderBand";
import { KpiStrip } from "./_components/KpiStrip";
import { ScoreTrendSection } from "./_components/ScoreTrendSection";
import { SkillBreakdown } from "./_components/SkillBreakdown";
import { TwoColPerformance } from "./_components/TwoColPerformance";
import { BottomRow } from "./_components/BottomRow";

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
