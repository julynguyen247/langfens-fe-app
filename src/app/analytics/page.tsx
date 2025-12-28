"use client";

import { useEffect, useState } from "react";
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
} from "@/utils/api";
import PredictedBandWidget from "@/components/PredictedBandWidget";
import PenguinLottie from "@/components/PenguinLottie";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryRes, trendRes, strengthsRes, gamificationRes, errorsRes, recommendationsRes] = await Promise.all([
        getAnalyticsSummary(),
        getScoreTrend(30),
        getStrengthsWeaknesses(),
        getGamificationStats().catch(() => null),
        getWrongAnswers({ pageSize: 5 }).catch(() => null),
        getRecommendations(5).catch(() => null),
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
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonAnalytics />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* =============================================
            PAGE HEADER
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">Learning Report</h1>
            <p className="text-slate-500 mt-1">Your performance analysis and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/error-review"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Icon name="rate_review" className="text-xl text-red-500" />
              Review Errors
            </Link>
            <button
              onClick={loadData}
              className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Icon name="refresh" className="text-xl text-slate-600" />
            </button>
          </div>
        </motion.div>

        {/* =============================================
            EXECUTIVE SUMMARY - Key Metrics Strip
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <MetricCard
            label="TESTS TAKEN"
            value={summary?.totalAttempts ?? 0}
            icon="assignment"
            trend="+2 this week"
            trendPositive
          />
          <MetricCard
            label="AVG SCORE"
            value={`${(summary?.avgScore ?? 0).toFixed(1)}%`}
            icon="target"
            trend={summary?.avgScore && summary.avgScore > 50 ? "Above average" : "Keep practicing"}
            trendPositive={summary?.avgScore ? summary.avgScore > 50 : false}
          />
          <MetricCard
            label="STUDY TIME"
            value={formatTime(summary?.totalStudyTimeMin ?? 0)}
            icon="schedule"
            trend="Total hours"
          />
          <MetricCard
            label="STREAK"
            value={`${gamificationStreak ?? summary?.currentStreak ?? 0}`}
            icon="local_fire_department"
            suffix="days"
            trend="Keep it up!"
            trendPositive
          />
        </motion.div>

        {/* =============================================
            MAIN DASHBOARD - Split View (8 + 4 columns)
        ============================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Score Progression Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-900">Score Progression</h2>
                <p className="text-sm text-slate-500">Last 30 days performance</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                Average Score
              </div>
            </div>
            
            {scoreTrend.length > 0 ? (
              <AreaChart data={scoreTrend} />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Icon name="show_chart" className="text-5xl mb-2" />
                  <p>Complete tests to see your progress chart</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column: Predicted Band - Report Card Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-4"
          >
            <PredictedBandWidget />
          </motion.div>
        </div>

        {/* =============================================
            AI STUDY COACH - Tutor's Note
        ============================================= */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#EFF6FF] border border-blue-100 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Icon name="auto_awesome" className="text-2xl text-[#3B82F6]" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-2">AI Study Coach</h3>
                <p className="font-serif text-slate-700 leading-relaxed mb-4">
                  Based on your recent performance, I recommend focusing on <strong>{recommendations[0]?.reasons?.[0] || "question types you find challenging"}</strong>. 
                  Your accuracy in this area could be improved with targeted practice. 
                  I've prepared some exercises specifically for you.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {recommendations.slice(0, 3).map((rec) => (
                    <Link
                      key={rec.examId}
                      href={`/practice?examId=${rec.examId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-[#2563EB] hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      <Icon name="play_circle" className="text-base" />
                      {rec.title.length > 30 ? rec.title.slice(0, 30) + "..." : rec.title}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/study-plan"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Icon name="calendar_today" className="text-lg" />
                  View Study Plan
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* =============================================
            BOTTOM SECTION: Focus Areas + Mistake Review
        ============================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Focus Areas (Skill Tags Cloud) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon name="psychology" className="text-xl text-slate-600" />
              </div>
              <h2 className="font-serif text-lg font-bold text-slate-900">Focus Areas</h2>
            </div>

            {/* Strengths Tags */}
            {strengthsData?.strengths && strengthsData.strengths.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Strengths</p>
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Needs Work</p>
                <div className="flex flex-wrap gap-2">
                  {strengthsData.weaknesses.slice(0, 5).map((item) => (
                    <SkillTag key={item.type} item={item} isStrength={false} />
                  ))}
                </div>
              </div>
            )}

            {(!strengthsData?.strengths?.length && !strengthsData?.weaknesses?.length) && (
              <p className="text-slate-400 text-sm">Complete more tests to see your focus areas.</p>
            )}
          </motion.div>

          {/* Right: Mistake Review (Flash Error Cards) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Icon name="error" className="text-xl text-red-600" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-slate-900">Mistake Review</h2>
                  <p className="text-xs text-slate-500">{totalErrors} errors to review</p>
                </div>
              </div>
              <Link
                href="/error-review"
                className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium flex items-center gap-1"
              >
                View all <Icon name="arrow_forward" className="text-base" />
              </Link>
            </div>

            {recentErrors.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {recentErrors.map((error) => (
                  <ErrorFlashCard key={error.answerId} error={error} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Icon name="check_circle" className="text-4xl text-emerald-400 mb-2" />
                <p>No recent mistakes. Great job!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* =============================================
            EMPTY STATE
        ============================================= */}
        {!summary?.totalAttempts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 mb-6">
                <PenguinLottie />
              </div>
              <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">
                Start Your Learning Journey
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Complete practice tests to unlock your personalized learning report and insights.
              </p>
              <button
                onClick={() => router.push("/practice")}
                className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Icon name="play_arrow" className="text-xl" />
                Start Practicing
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ====================================
// METRIC CARD - Executive Summary Style
// ====================================
function MetricCard({
  label,
  value,
  icon,
  suffix,
  trend,
  trendPositive,
}: {
  label: string;
  value: string | number;
  icon: string;
  suffix?: string;
  trend?: string;
  trendPositive?: boolean;
}) {
  return (
    <div className="relative bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      {/* Background Icon */}
      <Icon name={icon} className="absolute top-3 right-3 text-3xl text-slate-100 group-hover:text-slate-200 transition-colors" />
      
      {/* Label */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      
      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className="font-serif text-3xl font-bold text-slate-800">{value}</span>
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
      
      {/* Trend */}
      {trend && (
        <p className={`text-xs mt-2 ${trendPositive ? "text-emerald-600" : "text-slate-500"}`}>
          {trendPositive && <Icon name="trending_up" className="text-sm inline mr-0.5" />}
          {trend}
        </p>
      )}
    </div>
  );
}

// ====================================
// AREA CHART COMPONENT
// ====================================
function AreaChart({ data }: { data: ScoreTrendPoint[] }) {
  const maxScore = Math.max(...data.map((d) => d.avgScore), 100);
  const minScore = Math.min(...data.map((d) => d.avgScore), 0);
  const range = maxScore - minScore || 100;
  
  // Generate SVG path for area chart
  const width = 100;
  const height = 60;
  const padding = 2;
  
  const points = data.map((point, index) => {
    const x = padding + ((width - padding * 2) / (data.length - 1)) * index;
    const y = height - padding - ((point.avgScore - minScore) / range) * (height - padding * 2);
    return { x, y, ...point };
  });
  
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? width} ${height} L ${points[0]?.x ?? 0} ${height} Z`;

  return (
    <div className="relative h-64">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-4">
        {[100, 75, 50, 25, 0].map((pct) => (
          <div key={pct} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
            <div className="flex-1 border-t border-dashed border-slate-100" />
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area Fill */}
        <path d={areaPath} fill="url(#areaFill)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="0.8"
            fill="#3B82F6"
            className="hover:r-[1.5] transition-all"
          />
        ))}
      </svg>

      {/* X-axis Labels */}
      <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs text-slate-400">
        {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((p) => (
          <span key={p.date}>{formatShortDate(p.date)}</span>
        ))}
      </div>
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-default transition-all ${
          isStrength
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
        }`}
      >
        <Icon name={isStrength ? "check_circle" : "error"} className="text-sm" />
        {formatQuestionType(item.type)}
      </span>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
          <div className="font-medium">{Math.round(item.accuracy)}% accuracy</div>
          <div className="text-slate-300">{item.correctAnswers}/{item.totalQuestions} correct</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

// ====================================
// ERROR FLASH CARD
// ====================================
function ErrorFlashCard({ error }: { error: WrongAnswer }) {
  return (
    <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-100 hover:border-red-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
              {error.skill}
            </span>
            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
              {formatQuestionType(error.questionType)}
            </span>
          </div>
          <p className="text-sm text-slate-700 line-clamp-1">{error.questionContent}</p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-red-600 line-through">{error.userAnswer || "(empty)"}</span>
            <Icon name="arrow_right_alt" className="text-slate-400 text-sm" />
            <span className="text-emerald-600 font-medium">{error.correctAnswer}</span>
          </div>
        </div>
        <Link
          href={`/attempts/${error.attemptId}`}
          className="flex-shrink-0 p-2 text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Icon name="visibility" className="text-lg" />
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
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-80 bg-slate-200 rounded-xl" />
        <div className="lg:col-span-4 h-80 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 bg-slate-200 rounded-xl" />
        <div className="h-48 bg-slate-200 rounded-xl" />
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
