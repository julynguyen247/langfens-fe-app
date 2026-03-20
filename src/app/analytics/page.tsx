"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "@/utils/api";
import PredictedBandWidget from "@/components/PredictedBandWidget";
import PenguinLottie from "@/components/PenguinLottie";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityCalendar } from "@/components/ui/ActivityCalendar";

// Types
type AnalyticsSummary = {
  totalAttempts: number;
  totalStudyTimeMin: number;
  avgScore: number;
  currentStreak: number;
  testsBySkill: Record<string, number>;
};

type ScoreTrendPoint = {
  date: string;
  avgScore: number;
  testCount: number;
};

type QuestionTypeAccuracy = {
  type: string;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
};

type StrengthsWeaknesses = {
  strengths: QuestionTypeAccuracy[];
  weaknesses: QuestionTypeAccuracy[];
};

type WrongAnswer = {
  answerId: string;
  questionId: string;
  questionContent: string;
  questionType: string;
  skill: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  attemptDate: string;
  examId: string;
  attemptId: string;
};

type Recommendation = {
  examId: string;
  title: string;
  category: string;
  reasons: string[];
  relevanceScore: number;
  questionCount: number;
};

type AiInsight = {
  type: "success" | "warning" | "danger";
  message: string;
};

type ActivityDay = {
  date: string;
  count: number;
};

// Chart card style constant
const CARD_CLASS =
  "bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6";

export default function AnalyticsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [scoreTrend, setScoreTrend] = useState<ScoreTrendPoint[]>([]);
  const [strengthsData, setStrengthsData] = useState<StrengthsWeaknesses | null>(null);
  const [loading, setLoading] = useState(true);
  const [gamificationStreak, setGamificationStreak] = useState<number | null>(null);
  const [recentErrors, setRecentErrors] = useState<WrongAnswer[]>([]);
  const [totalErrors, setTotalErrors] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [activityDays, setActivityDays] = useState<ActivityDay[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryRes, trendRes, strengthsRes, gamificationRes, errorsRes, recommendationsRes, aiInsightsRes, activityRes] = await Promise.all([
        getAnalyticsSummary(),
        getScoreTrend(30),
        getStrengthsWeaknesses(),
        getGamificationStats().catch(() => null),
        getWrongAnswers({ pageSize: 5 }).catch(() => null),
        getRecommendations(5).catch(() => null),
        getAiInsights().catch(() => null),
        getRecentAnalyticsActivity(90).catch(() => null),
      ]);

      const summaryData = (summaryRes as any)?.data?.data ?? (summaryRes as any)?.data;
      const trendData = (trendRes as any)?.data?.data?.data ?? (trendRes as any)?.data?.data ?? [];
      const strengthsRaw = (strengthsRes as any)?.data?.data ?? (strengthsRes as any)?.data;

      setSummary(summaryData);
      setScoreTrend(Array.isArray(trendData) ? trendData : []);
      setStrengthsData(strengthsRaw);

      const gamificationData = (gamificationRes as any)?.data?.data ?? (gamificationRes as any)?.data;
      if (gamificationData?.currentStreak !== undefined) {
        setGamificationStreak(gamificationData.currentStreak);
      }

      const errorsData = (errorsRes as any)?.data?.data;
      if (errorsData) {
        setRecentErrors(errorsData.items ?? []);
        setTotalErrors(errorsData.total ?? 0);
      }

      const recommendationsData = (recommendationsRes as any)?.data?.data?.recommendations ?? [];
      setRecommendations(recommendationsData);

      const insightsRaw = (aiInsightsRes as any)?.data?.data ?? (aiInsightsRes as any)?.data ?? [];
      setAiInsights(Array.isArray(insightsRaw) ? insightsRaw : []);

      const activityRaw = (activityRes as any)?.data?.data ?? (activityRes as any)?.data ?? [];
      setActivityDays(Array.isArray(activityRaw) ? activityRaw : []);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--background)]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonAnalytics />
        </main>
      </div>
    );
  }

  // Empty state: no tests taken
  if (!summary?.totalAttempts) {
    return (
      <div className="min-h-screen w-full bg-[var(--background)]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={CARD_CLASS}>
              <EmptyState
                title="Complete a test to unlock your analytics"
                subtitle="Take a practice test and come back here to see your personalized insights dashboard."
                ctaText="Take a Test"
                ctaHref="/practice"
              />
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Combine strengths + weaknesses into a sorted list for question type performance bars
  const allQuestionTypes: QuestionTypeAccuracy[] = [
    ...(strengthsData?.strengths ?? []),
    ...(strengthsData?.weaknesses ?? []),
  ].sort((a, b) => b.accuracy - a.accuracy);

  // Build skill breakdown from summary.testsBySkill
  const skillEntries = summary?.testsBySkill
    ? Object.entries(summary.testsBySkill)
    : [];
  const totalSkillTests = skillEntries.reduce((sum, [, v]) => sum + v, 0) || 1;

  return (
    <div className="min-h-screen w-full bg-[var(--background)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1
              className="text-3xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Insights Dashboard
            </h1>
            <p className="text-[var(--text-muted)] mt-1">Your performance analysis and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/error-review"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all"
            >
              Review Errors
            </Link>
            <button
              onClick={loadData}
              className="px-4 py-2.5 rounded-full bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all"
            >
              Refresh
            </button>
          </div>
        </motion.div>

        {/* EXECUTIVE SUMMARY - Key Metrics Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <MetricCard
            label="Tests taken"
            value={summary?.totalAttempts ?? 0}
            trend="+2 this week"
            trendPositive
          />
          <MetricCard
            label="Avg score"
            value={`${(summary?.avgScore ?? 0).toFixed(1)}%`}
            trend={summary?.avgScore && summary.avgScore > 50 ? "Above average" : "Keep practicing"}
            trendPositive={summary?.avgScore ? summary.avgScore > 50 : false}
          />
          <MetricCard
            label="Study time"
            value={formatTime(summary?.totalStudyTimeMin ?? 0)}
            trend="Total hours"
          />
          <MetricCard
            label="Streak"
            value={`${gamificationStreak ?? summary?.currentStreak ?? 0}`}
            suffix="days"
            trend="Keep it up!"
            trendPositive
          />
        </motion.div>

        {/* 2-COLUMN CHART GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Score Trend Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0 }}
            className={CARD_CLASS}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-lg font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Score Trend
                </h2>
                <p className="text-sm text-[var(--text-muted)]">Last 30 days</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="w-3 h-3 rounded-full bg-[var(--primary)]" />
                Band score
              </div>
            </div>

            {scoreTrend.length > 0 ? (
              <ScoreTrendLineChart data={scoreTrend} />
            ) : (
              <div className="h-52 flex items-center justify-center text-[var(--text-muted)]">
                <div className="text-center">
                  <p className="text-lg font-bold mb-1">No data yet</p>
                  <p>Complete tests to see your progress chart</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* 2. Skill Breakdown Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={CARD_CLASS}
          >
            <h2
              className="text-lg font-bold text-[var(--foreground)] mb-1"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Skill Breakdown
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">Tests by skill type</p>

            {skillEntries.length > 0 ? (
              <SkillDonutChart
                data={skillEntries.map(([skill, count]) => ({
                  skill,
                  count,
                  fraction: count / totalSkillTests,
                }))}
                overallScore={summary?.avgScore ?? 0}
              />
            ) : (
              <div className="h-52 flex items-center justify-center text-[var(--text-muted)]">
                <p>No skill data available</p>
              </div>
            )}
          </motion.div>

          {/* 3. Activity Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={CARD_CLASS}
          >
            <h2
              className="text-lg font-bold text-[var(--foreground)] mb-1"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Activity Heatmap
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">Your daily practice activity</p>

            <ActivityCalendar compact={false} days={activityDays} />

            <div className="flex items-center gap-2 mt-4 text-xs text-[var(--text-muted)]">
              <span>Less</span>
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
              <span>More</span>
            </div>
          </motion.div>

          {/* 4. Question Type Performance (horizontal bars) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={CARD_CLASS}
          >
            <h2
              className="text-lg font-bold text-[var(--foreground)] mb-1"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Question Type Performance
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">Accuracy by question type</p>

            {allQuestionTypes.length > 0 ? (
              <QuestionTypePerformanceBars items={allQuestionTypes} />
            ) : (
              <div className="h-52 flex items-center justify-center text-[var(--text-muted)]">
                <p>Complete more tests to see performance by type</p>
              </div>
            )}
          </motion.div>

          {/* 5. AI Insight Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={CARD_CLASS}
          >
            <h2
              className="text-lg font-bold text-[var(--foreground)] mb-1"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              AI Insights
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">Personalized study recommendations</p>

            {aiInsights.length > 0 ? (
              <div className="space-y-3">
                {aiInsights.map((insight, idx) => (
                  <AiInsightCard key={idx} insight={insight} />
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 4).map((rec, idx) => (
                  <AiInsightCard
                    key={rec.examId}
                    insight={{
                      type: idx === 0 ? "warning" : "success",
                      message: rec.reasons?.[0] ?? rec.title,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-[var(--text-muted)]">
                <p>Complete more tests to receive AI insights</p>
              </div>
            )}
          </motion.div>

          {/* Predicted Band Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <PredictedBandWidget />
          </motion.div>
        </div>

        {/* AI STUDY COACH */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[var(--primary-light)] rounded-[2rem] border-[3px] border-[var(--border)] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0 border-b-[3px] border-[var(--primary-dark)]">
                <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-sans)" }}>AI</span>
              </div>
              <div className="flex-1">
                <h3
                  className="text-lg font-bold text-[var(--foreground)] mb-2"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  AI Study Coach
                </h3>
                <p className="text-[var(--text-body)] leading-relaxed mb-4">
                  Based on your recent performance, I recommend focusing on <strong>{recommendations[0]?.reasons?.[0] || "question types you find challenging"}</strong>.
                  Your accuracy in this area could be improved with targeted practice.
                  I've prepared some exercises specifically for you.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {recommendations.slice(0, 3).map((rec) => (
                    <Link
                      key={rec.examId}
                      href={`/practice?examId=${rec.examId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border-[2px] border-[var(--border)] text-sm text-[var(--primary)] font-bold shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all"
                    >
                      {rec.title.length > 30 ? rec.title.slice(0, 30) + "..." : rec.title}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/study-plan"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
                >
                  View Study Plan
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* BOTTOM SECTION: Focus Areas + Mistake Review */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Focus Areas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={CARD_CLASS}
          >
            <div className="flex items-center gap-3 mb-5">
              <h2
                className="text-lg font-bold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Focus Areas
              </h2>
            </div>

            {/* Strengths Tags */}
            {strengthsData?.strengths && strengthsData.strengths.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-[var(--text-muted)] tracking-wide mb-2">Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {strengthsData.strengths.slice(0, 5).map((item) => (
                    <SkillTag key={item.type} item={item} isStrength />
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses Tags */}
            {strengthsData?.weaknesses && strengthsData.weaknesses.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] tracking-wide mb-2">Needs work</p>
                <div className="flex flex-wrap gap-2">
                  {strengthsData.weaknesses.slice(0, 5).map((item) => (
                    <SkillTag key={item.type} item={item} isStrength={false} />
                  ))}
                </div>
              </div>
            )}

            {(!strengthsData?.strengths?.length && !strengthsData?.weaknesses?.length) && (
              <p className="text-[var(--text-muted)] text-sm">Complete more tests to see your focus areas.</p>
            )}
          </motion.div>

          {/* Right: Mistake Review */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={CARD_CLASS}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div>
                  <h2
                    className="text-lg font-bold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Mistake Review
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
                    {totalErrors} errors to review
                  </p>
                </div>
              </div>
              <Link
                href="/error-review"
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-bold"
              >
                View all
              </Link>
            </div>

            {recentErrors.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {recentErrors.map((error) => (
                  <ErrorFlashCard key={error.answerId} error={error} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <p className="text-lg font-bold text-[var(--skill-speaking)] mb-1">All clear</p>
                <p>No recent mistakes. Great job!</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// ====================================
// SCORE TREND LINE CHART (SVG polyline with dash animation + tooltip)
// ====================================
function ScoreTrendLineChart({ data }: { data: ScoreTrendPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 500;
  const height = 200;
  const padTop = 20;
  const padBottom = 30;
  const padLeft = 40;
  const padRight = 20;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const scores = data.map((d) => d.avgScore);
  const maxScore = Math.max(...scores, 100);
  const minScore = Math.min(...scores, 0);
  const range = maxScore - minScore || 100;

  const points = data.map((point, index) => {
    const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;
    const x = padLeft + xStep * index;
    const y = padTop + chartH - ((point.avgScore - minScore) / range) * chartH;
    return { x: isNaN(x) ? padLeft : x, y: isNaN(y) ? height / 2 : y, ...point };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Calculate total path length for stroke-dasharray animation
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  // Y-axis grid lines
  const gridLines = [0, 25, 50, 75, 100].filter(
    (v) => v >= minScore && v <= maxScore
  );

  return (
    <div className="relative" style={{ aspectRatio: `${width}/${height}` }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {gridLines.map((val) => {
          const y = padTop + chartH - ((val - minScore) / range) * chartH;
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize="10"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Animated polyline */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLength}
          strokeDashoffset={totalLength}
          style={{
            animation: "dashDraw 1.5s ease-out forwards",
          }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 5 : 3.5}
              fill="white"
              stroke="var(--primary)"
              strokeWidth="2"
              style={{ cursor: "pointer", transition: "r 0.15s" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          </g>
        ))}

        {/* X-axis date labels */}
        {data
          .filter((_, i) => i % Math.max(1, Math.ceil(data.length / 6)) === 0)
          .map((p, filteredIdx) => {
            const origIdx = data.indexOf(p);
            const pt = points[origIdx];
            return (
              <text
                key={p.date}
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="9"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {formatShortDate(p.date)}
              </text>
            );
          })}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="absolute pointer-events-none z-10 bg-[var(--foreground)] text-white text-xs rounded-xl px-3 py-2 shadow-lg"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
            top: `${(points[hoveredIdx].y / height) * 100 - 14}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-bold" style={{ fontFamily: "var(--font-mono)" }}>
            {points[hoveredIdx].avgScore.toFixed(1)}%
          </div>
          <div style={{ fontFamily: "var(--font-mono)" }}>
            {formatShortDate(points[hoveredIdx].date)}
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-[var(--foreground)]"
          />
        </div>
      )}

      {/* Inline keyframe for dash animation */}
      <style>{`
        @keyframes dashDraw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

// ====================================
// SKILL BREAKDOWN DONUT CHART (SVG with stroke-dashoffset animation)
// ====================================
function SkillDonutChart({
  data,
  overallScore,
}: {
  data: { skill: string; count: number; fraction: number }[];
  overallScore: number;
}) {
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const skillColorMap: Record<string, string> = {
    Reading: "var(--skill-reading)",
    Listening: "var(--skill-listening)",
    Writing: "var(--skill-writing)",
    Speaking: "var(--skill-speaking)",
  };

  // Build cumulative offsets
  let cumulativeOffset = 0;
  const segments = data.map((d) => {
    const segLength = d.fraction * circumference;
    const gap = 4; // gap between segments
    const dashArray = `${Math.max(0, segLength - gap)} ${circumference - Math.max(0, segLength - gap)}`;
    const offset = -cumulativeOffset;
    cumulativeOffset += segLength;
    return {
      ...d,
      dashArray,
      offset,
      color: skillColorMap[d.skill] ?? "var(--primary)",
    };
  });

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={seg.skill}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                animation: `donutFadeIn 0.8s ease-out ${0.2 + i * 0.15}s both`,
              }}
            />
          ))}
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {overallScore.toFixed(1)}%
          </span>
          <span className="text-xs text-[var(--text-muted)]">overall</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.skill} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-sm text-[var(--text-body)]">{seg.skill}</span>
            <span
              className="text-sm text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {Math.round(seg.fraction * 100)}%
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes donutFadeIn {
          from { stroke-dashoffset: ${circumference}; opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ====================================
// QUESTION TYPE PERFORMANCE BARS (horizontal, sorted by accuracy)
// ====================================
function QuestionTypePerformanceBars({ items }: { items: QuestionTypeAccuracy[] }) {
  return (
    <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
      {items.map((item, idx) => {
        const pct = Math.round(item.accuracy);
        let barColor: string;
        if (pct > 70) {
          barColor = "var(--skill-speaking)"; // green
        } else if (pct >= 40) {
          barColor = "var(--accent-gold)"; // amber
        } else {
          barColor = "var(--destructive)"; // red
        }

        return (
          <div key={item.type} className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-body)] w-32 flex-shrink-0 truncate">
              {formatQuestionType(item.type)}
            </span>
            <div className="flex-1 h-6 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.05, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
              />
            </div>
            <span
              className="text-sm font-bold w-12 text-right flex-shrink-0"
              style={{
                fontFamily: "var(--font-mono)",
                color: barColor,
              }}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ====================================
// AI INSIGHT CARD (with colored left border)
// ====================================
function AiInsightCard({ insight }: { insight: AiInsight }) {
  const borderColorMap: Record<string, string> = {
    success: "var(--skill-speaking)", // green
    warning: "var(--accent-gold)", // amber
    danger: "var(--destructive)", // red
  };
  const borderColor = borderColorMap[insight.type] ?? "var(--primary)";

  return (
    <div
      className="rounded-xl bg-[var(--background)] p-4"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <p className="text-sm text-[var(--text-body)] leading-relaxed">
        {insight.message}
      </p>
    </div>
  );
}

// ====================================
// METRIC CARD
// ====================================
function MetricCard({
  label,
  value,
  suffix,
  trend,
  trendPositive,
}: {
  label: string;
  value: string | number;
  icon?: string;
  suffix?: string;
  trend?: string;
  trendPositive?: boolean;
}) {
  return (
    <div className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all">
      {/* Label */}
      <p className="text-xs font-bold text-[var(--text-muted)] tracking-wide mb-1">{label}</p>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span
          className="text-3xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </span>
        {suffix && <span className="text-sm text-[var(--text-muted)]">{suffix}</span>}
      </div>

      {/* Trend */}
      {trend && (
        <p className={`text-xs mt-2 font-bold ${trendPositive ? "text-[var(--skill-speaking)]" : "text-[var(--text-muted)]"}`}>
          {trend}
        </p>
      )}
    </div>
  );
}

// ====================================
// SKILL TAG COMPONENT
// ====================================
function SkillTag({ item, isStrength }: { item: QuestionTypeAccuracy; isStrength: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border-[2px] cursor-default transition-all ${
          isStrength
            ? "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)] hover:bg-[var(--skill-speaking-light)]"
            : "bg-red-50 text-[var(--destructive)] border-red-200 hover:bg-red-100"
        }`}
      >
        {formatQuestionType(item.type)}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--foreground)] text-white text-xs rounded-xl shadow-lg whitespace-nowrap z-10">
          <div className="font-bold" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(item.accuracy)}% accuracy</div>
          <div className="text-[var(--border)]" style={{ fontFamily: "var(--font-mono)" }}>{item.correctAnswers}/{item.totalQuestions} correct</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[var(--foreground)]" />
        </div>
      )}
    </div>
  );
}

// ====================================
// ERROR FLASH CARD
// ====================================
function ErrorFlashCard({ error }: { error: WrongAnswer }) {
  const skillColorMap: Record<string, string> = {
    Reading: "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]",
    Listening: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
    Writing: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
    Speaking: "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]",
  };
  const skillStyle = skillColorMap[error.skill] || "bg-[var(--primary-light)] text-[var(--primary)] border-[var(--skill-reading-border)]";

  return (
    <div className="p-3 bg-[var(--background)] rounded-xl border-[2px] border-[var(--border)] hover:border-[var(--destructive)] transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border-[1px] ${skillStyle}`}>
              {error.skill}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[1px] border-[var(--skill-writing-border)]">
              {formatQuestionType(error.questionType)}
            </span>
          </div>
          <p className="text-sm text-[var(--text-body)] line-clamp-1">{error.questionContent}</p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-[var(--destructive)] line-through font-bold">{error.userAnswer || "(empty)"}</span>
            <span className="text-[var(--text-muted)]">-&gt;</span>
            <span className="text-[var(--skill-speaking)] font-bold">{error.correctAnswer}</span>
          </div>
        </div>
        <Link
          href={`/attempts/${error.attemptId}`}
          className="flex-shrink-0 px-3 py-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-full font-bold text-sm transition-all"
        >
          View
        </Link>
      </div>
    </div>
  );
}

// ====================================
// SKELETON LOADER
// ====================================
function SkeletonAnalytics() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[var(--border)] animate-pulse rounded-[2rem]" />
          <div className="h-4 w-64 bg-[var(--border)] animate-pulse rounded-[2rem]" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[var(--border)] animate-pulse rounded-[2rem]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-72 bg-[var(--border)] animate-pulse rounded-[2rem]" />
        ))}
      </div>
    </div>
  );
}

// ====================================
// UTILITY FUNCTIONS
// ====================================
function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function formatQuestionType(type: string): string {
  const typeMap: Record<string, string> = {
    MCQ_SINGLE: "Multiple Choice",
    MCQ_MULTIPLE: "Multiple Select",
    TRUE_FALSE_NOT_GIVEN: "T/F/NG",
    YES_NO_NOT_GIVEN: "Y/N/NG",
    MATCHING_HEADING: "Matching Heading",
    MATCHING_INFORMATION: "Matching Info",
    MATCHING_FEATURES: "Matching Features",
    SUMMARY_COMPLETION: "Summary",
    TABLE_COMPLETION: "Table",
    SHORT_ANSWER: "Short Answer",
    DIAGRAM_LABEL: "Diagram",
    MAP_LABEL: "Map",
  };
  return typeMap[type] || type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}
