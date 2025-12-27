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
import { FiTrendingUp, FiClock, FiTarget, FiActivity, FiCheck, FiX, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { HiOutlineFire } from "react-icons/hi";
import PredictedBandWidget from "@/components/PredictedBandWidget";

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

type RecentActivity = {
  type: string;
  examId: string;
  examTitle?: string;
  score?: number;
  date: string;
  durationMin: number;
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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
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
      const [summaryRes, trendRes, strengthsRes, activityRes, gamificationRes, errorsRes, recommendationsRes] = await Promise.all([
        getAnalyticsSummary(),
        getScoreTrend(30),
        getStrengthsWeaknesses(),
        getRecentAnalyticsActivity(10),
        getGamificationStats().catch(() => null),
        getWrongAnswers({ pageSize: 5 }).catch(() => null),
        getRecommendations(5).catch(() => null),
      ]);

      const summaryData = (summaryRes as any)?.data?.data ?? (summaryRes as any)?.data;
      const trendData = (trendRes as any)?.data?.data?.data ?? (trendRes as any)?.data?.data ?? [];
      const strengthsRaw = (strengthsRes as any)?.data?.data ?? (strengthsRes as any)?.data;
      const activityData = (activityRes as any)?.data?.data?.activities ?? (activityRes as any)?.data?.activities ?? [];

      setSummary(summaryData);
      setScoreTrend(Array.isArray(trendData) ? trendData : []);
      setStrengthsData(strengthsRaw);
      setRecentActivity(Array.isArray(activityData) ? activityData : []);

      // Get gamification streak (source of truth, same as profile page)
      const gamificationData = (gamificationRes as any)?.data?.data ?? (gamificationRes as any)?.data;
      if (gamificationData?.currentStreak !== undefined) {
        setGamificationStreak(gamificationData.currentStreak);
      }

      // Get recent errors
      const errorsData = (errorsRes as any)?.data?.data;
      if (errorsData) {
        setRecentErrors(errorsData.items ?? []);
        setTotalErrors(errorsData.total ?? 0);
      }
      
      // Get recommendations
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
      <div className="w-full min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <main className="mx-auto max-w-6xl px-4 py-8">
          <SkeletonAnalytics />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-slate-900">Phân tích học tập</h1>
          <p className="text-slate-500">Theo dõi tiến độ và hiệu suất của bạn</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <SummaryCard
            icon={<FiActivity className="w-5 h-5" />}
            label="Bài đã làm"
            value={summary?.totalAttempts ?? 0}
            color="blue"
          />
          <SummaryCard
            icon={<FiTarget className="w-5 h-5" />}
            label="Điểm TB"
            value={summary?.avgScore ? `${summary.avgScore.toFixed(1)}%` : "0%"}
            color="green"
          />
          <SummaryCard
            icon={<FiClock className="w-5 h-5" />}
            label="Thời gian học"
            value={formatTime(summary?.totalStudyTimeMin ?? 0)}
            color="purple"
          />
          <SummaryCard
            icon={<HiOutlineFire className="w-5 h-5" />}
            label="Streak"
            value={`${gamificationStreak ?? summary?.currentStreak ?? 0} ngày`}
            color="orange"
          />
        </motion.div>

        {summary?.testsBySkill && Object.keys(summary.testsBySkill).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Bài thi theo kỹ năng</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(summary.testsBySkill).map(([skill, count]) => (
                <div
                  key={skill}
                  className="px-4 py-2 bg-slate-100 rounded-full text-sm"
                >
                  <span className="font-medium text-slate-700">{skill}</span>
                  <span className="ml-2 text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Predicted Band Score */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PredictedBandWidget />
        </motion.div>

        {/* Score Trend */}
        {scoreTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              <FiTrendingUp className="inline-block w-5 h-5 mr-2 text-blue-600" />
              Xu hướng điểm số (30 ngày)
            </h2>
            <ScoreChart data={scoreTrend} />
          </motion.div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <FiCheck className="w-4 h-4 text-green-600" />
              </div>
              Điểm mạnh
            </h2>
            {strengthsData?.strengths && strengthsData.strengths.length > 0 ? (
              <div className="space-y-3">
                {strengthsData.strengths.slice(0, 5).map((item) => (
                  <AccuracyBar key={item.type} item={item} isStrength />
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Chưa có dữ liệu</p>
            )}
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <FiX className="w-4 h-4 text-red-600" />
              </div>
              Cần cải thiện
            </h2>
            {strengthsData?.weaknesses && strengthsData.weaknesses.length > 0 ? (
              <div className="space-y-3">
                {strengthsData.weaknesses.slice(0, 5).map((item) => (
                  <AccuracyBar key={item.type} item={item} isStrength={false} />
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Chưa có dữ liệu</p>
            )}
          </motion.div>
        </div>

        {/* Recent Errors */}
        {recentErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-red-500"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5 text-red-500" />
                Câu sai gần đây
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                  {totalErrors} câu
                </span>
              </h2>
              <Link
                href="/error-review"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Xem tất cả <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentErrors.slice(0, 5).map((error) => (
                <div key={error.answerId} className="p-4 bg-red-50 rounded-xl border border-red-100">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                      {error.skill}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                      {formatQuestionType(error.questionType)}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {new Date(error.attemptDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  
                  {/* Question */}
                  <p className="text-sm text-slate-800 mb-3">
                    {error.questionContent}
                  </p>
                  
                  {/* Answers */}
                  <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                    <span className="text-slate-500">Bạn:</span>
                    <span className="px-2 py-0.5 bg-red-200 text-red-700 rounded line-through">
                      {error.userAnswer || "(Bỏ trống)"}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-500">Đáp án:</span>
                    <span className="px-2 py-0.5 bg-emerald-500 text-white rounded font-medium">
                      {error.correctAnswer || "—"}
                    </span>
                  </div>
                  
                  {/* Explanation */}
                  {error.explanation && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-slate-700 mb-3 border border-blue-100">
                      <span className="font-medium text-blue-700">💡 Giải thích: </span>
                      {error.explanation}
                    </div>
                  )}
                  
                  {/* Link to attempt */}
                  <Link
                    href={`/attempts/${error.attemptId}`}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                  >
                    Xem chi tiết bài làm <FiArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Exam Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-sm border border-emerald-100"
          >
            <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
              <FiTarget className="w-5 h-5" />
              Bài tập đề xuất
            </h2>
            <p className="text-sm text-emerald-700 mb-4">
              Các bài thi được gợi ý dựa trên điểm yếu của bạn
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {recommendations.map((rec) => (
                <Link
                  key={rec.examId}
                  href={`/practice?examId=${rec.examId}`}
                  className="bg-white rounded-xl p-4 border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 group-hover:text-emerald-700 transition truncate">
                        {rec.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                          {rec.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {rec.questionCount} câu
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rec.reasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 group-hover:translate-x-1 transition">
                      <FiArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Hoạt động gần đây</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={`${activity.examId}-${index}`}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {activity.type?.slice(0, 2) || "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {activity.examTitle || "Bài kiểm tra"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(activity.date)} • {activity.durationMin} phút
                    </div>
                  </div>
                  {activity.score !== undefined && activity.score !== null && (
                    <div className={`text-lg font-bold ${
                      activity.score >= 70 ? "text-green-600" : 
                      activity.score >= 50 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {activity.score.toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!summary?.totalAttempts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 shadow-sm text-center"
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Chưa có dữ liệu phân tích
            </h3>
            <p className="text-slate-500 mb-6">
              Hoàn thành một số bài kiểm tra để xem thống kê học tập của bạn
            </p>
            <button
              onClick={() => router.push("/practice")}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              Bắt đầu luyện tập
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className={`p-4 rounded-2xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ScoreChart({ data }: { data: ScoreTrendPoint[] }) {
  const maxScore = Math.max(...data.map((d) => d.avgScore), 100);
  
  return (
    <div className="h-48 flex items-end gap-1">
      {data.map((point, index) => {
        const height = (point.avgScore / maxScore) * 100;
        return (
          <div
            key={point.date}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${point.date}: ${point.avgScore.toFixed(1)}%`}
          >
            <div
              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
              style={{ height: `${height}%`, minHeight: "4px" }}
            />
            {index % Math.ceil(data.length / 7) === 0 && (
              <span className="text-[10px] text-slate-400 rotate-[-45deg] origin-top-left whitespace-nowrap mt-1">
                {formatShortDate(point.date)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AccuracyBar({
  item,
  isStrength,
}: {
  item: QuestionTypeAccuracy;
  isStrength: boolean;
}) {
  const accuracyPercent = Math.min(100, Math.round(item.accuracy));
  const bgColor = isStrength ? "bg-green-500" : "bg-red-500";
  const bgLight = isStrength ? "bg-green-100" : "bg-red-100";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{formatQuestionType(item.type)}</span>
        <span className={isStrength ? "text-green-600" : "text-red-600"}>
          {accuracyPercent}%
        </span>
      </div>
      <div className={`h-2 ${bgLight} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${bgColor} rounded-full transition-all`}
          style={{ width: `${accuracyPercent}%` }}
        />
      </div>
      <div className="text-xs text-slate-400">
        {item.correctAnswers}/{item.totalQuestions} câu đúng
      </div>
    </div>
  );
}

function SkeletonAnalytics() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-64 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}p` : `${hours}h`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
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
    MATCHING_INFORMATION: "Matching Information",
    MATCHING_FEATURES: "Matching Features",
    SUMMARY_COMPLETION: "Summary Completion",
    TABLE_COMPLETION: "Table Completion",
    SHORT_ANSWER: "Short Answer",
    DIAGRAM_LABEL: "Diagram Label",
    MAP_LABEL: "Map Label",
  };
  return typeMap[type] || type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}
