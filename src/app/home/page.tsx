"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAttempt,
  getMe,
  getPublicExams,
  startAttempt,
  getPlacementStatus,
  getWritingHistory,
  getSpeakingHistory,
  refresh,
  getAnalyticsSummary,
  getStrengthsWeaknesses,
  getScoreTrend,
  getRecentAnalyticsActivity,
  getGamificationStats,
  getRecommendations,
} from "@/utils/api";
import { FiPlay, FiCheck, FiX, FiActivity, FiTarget, FiClock, FiChevronRight } from "react-icons/fi";
import { HiOutlineFire } from "react-icons/hi";
import { TbTargetArrow } from "react-icons/tb";
import { useAttemptStore } from "../store/useAttemptStore";
import {
  barItem,
  fadeInUp,
  staggerBar,
  staggerContainer,
} from "./components/variants";
import { HeroHeader } from "./components/HeroHeader";
import {
  cryptoRandom,
  diffMinutesSafe,
  mapSpeakingHistoryToAttempt,
  mapWritingHistoryToAttempt,
} from "./components/utils";

import { useLoadingStore } from "../store/loading";

type Course = {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  progress: number;
  lessonsDone: number;
  lessonsTotal: number;
};

export type Attempt = {
  id: string;
  title: string;
  skill: "Reading" | "Listening" | "Writing" | "Speaking";
  dateISO: string;
  score?: number;
  durationMin: number;
};

type PlacementStatus = {
  completed: boolean;
  attemptId: string;
  examId: string;
  status: string;
  startedAt: string;
  submittedAt: string;
  gradedAt: string;
  level: string;
  band: number;
};

export default function Home() {
  const router = useRouter();
  const { setAttempt } = useAttemptStore();

  const courses: Course[] = [
    {
      id: "c1",
      name: "IELTS Reading Mastery",
      level: "Intermediate",
      progress: 42,
      lessonsDone: 21,
      lessonsTotal: 50,
    },
    {
      id: "c2",
      name: "IELTS Listening Intensive",
      level: "Beginner",
      progress: 73,
      lessonsDone: 22,
      lessonsTotal: 30,
    },
    {
      id: "c3",
      name: "Writing 7.0+ Task 2",
      level: "Advanced",
      progress: 18,
      lessonsDone: 4,
      lessonsTotal: 22,
    },
  ];

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [attemptErr, setAttemptErr] = useState<string | null>(null);


  const { setLoading } = useLoadingStore();
  const [placementTestId, setPlacementTestId] = useState("");
  const [placementStatus, setPlacementStatus] =
    useState<PlacementStatus | null>(null);
  const [loadingPlacement, setLoadingPlacement] = useState(true);

  const [analyticsSummary, setAnalyticsSummary] = useState<{
    totalAttempts: number;
    totalStudyTimeMin: number;
    avgScore: number;
    currentStreak: number;
    testsBySkill: Record<string, number>;
  } | null>(null);
  const [strengthsData, setStrengthsData] = useState<{
    strengths: { type: string; accuracy: number; totalQuestions: number; correctAnswers: number }[];
    weaknesses: { type: string; accuracy: number; totalQuestions: number; correctAnswers: number }[];
  } | null>(null);
  const [scoreTrend, setScoreTrend] = useState<{ date: string; avgScore: number; testCount: number }[]>([]);
  const [recentAnalytics, setRecentAnalytics] = useState<{ type: string; examId: string; examTitle?: string; score?: number; date: string; durationMin: number }[]>([]);
  const [gamificationStreak, setGamificationStreak] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<{ examId: string; title: string; category: string; reasons: string[]; relevanceScore: number; questionCount: number }[]>([]);

  useEffect(() => {
    getMe().catch(() => {});

    (async () => {
      setLoadingAttempts(true);
      setAttemptErr(null);
      try {
        const [res, wres, sres, analyticsRes, strengthsRes, trendRes, recentRes, gamificationRes, recommendationsRes] = await Promise.all([
          getAttempt(1, 10),
          getWritingHistory(),
          getSpeakingHistory(),
          getAnalyticsSummary().catch(() => null),
          getStrengthsWeaknesses().catch(() => null),
          getScoreTrend(30).catch(() => null),
          getRecentAnalyticsActivity(10).catch(() => null),
          getGamificationStats().catch(() => null),
          getRecommendations(3).catch(() => null),
        ]);

        const raw =
          (res as any)?.data?.items ??
          (res as any)?.data?.data ??
          (res as any)?.data ??
          [];
        const list: Attempt[] = Array.isArray(raw)
          ? raw.map(normalizeAttemptItem)
          : [];

        const wraw = (wres as any)?.data?.data ?? [];
        const writingList: Attempt[] = Array.isArray(wraw)
          ? wraw.map(mapWritingHistoryToAttempt)
          : [];

        const sraw = (sres as any)?.data?.data ?? [];
        const speakingList: Attempt[] = Array.isArray(sraw)
          ? sraw.map(mapSpeakingHistoryToAttempt)
          : [];

        const merged = [...list, ...writingList, ...speakingList];
        merged.sort(
          (a, b) =>
            new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
        );
        setAttempts(merged);

        // Set analytics data
        const summaryData = (analyticsRes as any)?.data?.data ?? (analyticsRes as any)?.data;
        if (summaryData) setAnalyticsSummary(summaryData);
        
        const strengthsRaw = (strengthsRes as any)?.data?.data ?? (strengthsRes as any)?.data;
        if (strengthsRaw) setStrengthsData(strengthsRaw);

        const trendData = (trendRes as any)?.data?.data?.data ?? (trendRes as any)?.data?.data ?? [];
        if (Array.isArray(trendData)) setScoreTrend(trendData);

        const recentData = (recentRes as any)?.data?.data?.activities ?? (recentRes as any)?.data?.activities ?? [];
        if (Array.isArray(recentData)) setRecentAnalytics(recentData);

        // Get gamification streak (this is the source of truth, same as profile page)
        const gamificationData = (gamificationRes as any)?.data?.data ?? (gamificationRes as any)?.data;
        if (gamificationData?.currentStreak !== undefined) {
          setGamificationStreak(gamificationData.currentStreak);
        }
        
        // Get recommendations
        const recommendationsData = (recommendationsRes as any)?.data?.data?.recommendations ?? [];
        if (Array.isArray(recommendationsData)) {
          setRecommendations(recommendationsData);
        }
      } catch (e: any) {
        setAttemptErr(e?.message || "Không thể tải lịch sử làm bài.");
      } finally {
        setLoadingAttempts(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingPlacement(true);
      try {
        const [testsRes, statusRes] = await Promise.allSettled([
          getPublicExams(1, 24),
          getPlacementStatus(),
        ]);

        if (testsRes.status === "fulfilled") {
          const data =
            (testsRes.value as any)?.data?.data ??
            (testsRes.value as any)?.data ??
            [];

          const placement = Array.isArray(data)
            ? data.find((item: any) =>
                String(item.title || "").includes("English Placement")
              )
            : null;

          if (placement?.id) setPlacementTestId(String(placement.id));
        }

        if (statusRes.status === "fulfilled") {
          const raw =
            (statusRes.value as any)?.data?.data ??
            (statusRes.value as any)?.data ??
            (statusRes.value as any) ??
            null;

          if (raw) {
            setPlacementStatus({
              completed: !!raw.completed,
              attemptId: String(raw.attemptId ?? ""),
              examId: String(raw.examId ?? ""),
              status: String(raw.status ?? ""),
              startedAt: raw.startedAt,
              submittedAt: raw.submittedAt,
              gradedAt: raw.gradedAt,
              level: String(raw.level ?? ""),
              band: Number(raw.band ?? 0),
            });
          }
        }
      } finally {
        setLoadingPlacement(false);
      }
    })();
  }, []);

  const analytics = useMemo(() => {
    const total = attempts.length;
    const graded = attempts.filter((a) => typeof a.score === "number");
    const avg =
      graded.reduce((s, a) => s + (a.score || 0), 0) / (graded.length || 1);
    const streakDays = 5;
    return { total, avg: Math.round(avg), streakDays };
  }, [attempts]);

  const visibleAttempts = useMemo(() => attempts.slice(0, 3), [attempts]);

  async function handleStart(id: string) {
    try {
      setLoading(true);
      const res = await startAttempt(id);
      const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      const attemptId: string | undefined = payload?.attemptId ?? payload?.id;
      if (!attemptId) throw new Error("Missing attemptId");
      setAttempt(payload);
      router.push(`/placement/${attemptId}`);
    } catch (err) {
      console.error(err);
      alert("Không thể bắt đầu bài. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }

  function buildAttemptDetailUrl(a: Attempt) {
    if (a.skill === "Writing") return `/attempts/${a.id}?source=writing`;
    if (a.skill === "Speaking") return `/attempts/${a.id}?source=speaking`;
    return `/attempts/${a.id}?source=attempt`;
  }

  const hasPlacementTest = !!placementStatus?.completed;
  const placementProgress = hasPlacementTest ? 100 : 0;

  const placementSummary =
    placementStatus && typeof placementStatus.band === "number"
      ? `Bạn đã hoàn thành bài kiểm tra đầu vào. Band hiện tại: ${placementStatus.band.toFixed(
          1
        )} • Level: ${placementStatus.level || "N/A"}.`
      : "Bạn đã hoàn thành bài kiểm tra đầu vào.";

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <HeroHeader />

        {loadingPlacement ? (
          <SkeletonPlacement />
        ) : hasPlacementTest ? (
          <Card>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Bài kiểm tra đầu vào
                </p>

                <button
                  onClick={() =>
                    router.push(
                      `/attempts/${placementStatus?.attemptId}?source=attempt`
                    )
                  }
                  className="text-[11px] font-semibold tracking-wide uppercase text-blue-600 hover:text-blue-700"
                >
                  Xem kết quả
                </button>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <FiPlay className="w-5 h-5" />
                  </div>

                  <div className="relative flex-1 h-5 rounded-full bg-slate-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${placementProgress}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0"
                    >
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg,#3b82f6 0,#3b82f6 8px,#2563eb 8px,#2563eb 16px)",
                        }}
                      />
                    </motion.div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[12px] font-semibold text-white drop-shadow">
                        {placementProgress}%
                      </span>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <TbTargetArrow className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  {placementSummary}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Bài kiểm tra đầu vào
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <FiPlay className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-3">
                  <p className="text-sm text-slate-600">
                    Hãy làm bài kiểm tra đầu vào để chúng tôi có thể đánh giá
                    trình độ của bạn khách quan hơn và gợi ý lộ trình phù hợp.
                  </p>

                  <button
                    onClick={() =>
                      placementTestId && handleStart(placementTestId)
                    }
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!Boolean(placementTestId)}
                  >
                    Bắt đầu làm
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="space-y-4">
          <SectionTitle>Bắt đầu luyện tập</SectionTitle>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/practice?skill=reading")}
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 flex flex-col items-start gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-xl">📖</span>
              </div>
              <div className="font-semibold">Reading</div>
              <div className="text-xs text-white/80">Luyện đọc hiểu</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/practice?skill=listening")}
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20 flex flex-col items-start gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-xl">🎧</span>
              </div>
              <div className="font-semibold">Listening</div>
              <div className="text-xs text-white/80">Luyện nghe</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/flashcards")}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 flex flex-col items-start gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-xl">🃏</span>
              </div>
              <div className="font-semibold">Flashcards</div>
              <div className="text-xs text-white/80">Học từ vựng</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/bookmarks")}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex flex-col items-start gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-xl">🔖</span>
              </div>
              <div className="font-semibold">Bookmarks</div>
              <div className="text-xs text-white/80">Câu hỏi đã lưu</div>
            </motion.button>
          </div>
        </div>

        {/* Analytics Summary Section */}
        {analyticsSummary && analyticsSummary.totalAttempts > 0 && (
          <>
            <div className="flex items-center justify-between">
              <SectionTitle>Phân tích học tập</SectionTitle>
              <button
                onClick={() => router.push("/analytics")}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem chi tiết <FiChevronRight className="w-4 h-4" />
              </button>
            </div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <div className="p-4 rounded-2xl border bg-blue-50 text-blue-600 border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FiActivity className="w-5 h-5" />
                    <span className="text-xs font-medium opacity-80">Bài đã làm</span>
                  </div>
                  <div className="text-2xl font-bold">{analyticsSummary.totalAttempts}</div>
                </div>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <div className="p-4 rounded-2xl border bg-green-50 text-green-600 border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FiTarget className="w-5 h-5" />
                    <span className="text-xs font-medium opacity-80">Điểm TB</span>
                  </div>
                  <div className="text-2xl font-bold">{analyticsSummary.avgScore.toFixed(1)}%</div>
                </div>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <div className="p-4 rounded-2xl border bg-purple-50 text-purple-600 border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FiClock className="w-5 h-5" />
                    <span className="text-xs font-medium opacity-80">Thời gian học</span>
                  </div>
                  <div className="text-2xl font-bold">{formatStudyTime(analyticsSummary.totalStudyTimeMin)}</div>
                </div>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <div className="p-4 rounded-2xl border bg-orange-50 text-orange-600 border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <HiOutlineFire className="w-5 h-5" />
                    <span className="text-xs font-medium opacity-80">Streak</span>
                  </div>
                  <div className="text-2xl font-bold">{gamificationStreak ?? analyticsSummary.currentStreak} ngày</div>
                </div>
              </motion.div>
            </motion.div>

            {strengthsData && (strengthsData.strengths?.length > 0 || strengthsData.weaknesses?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strengthsData.strengths?.length > 0 && (
                  <Card>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Điểm mạnh</span>
                    </div>
                    <div className="space-y-3">
                      {strengthsData.strengths.slice(0, 3).map((item) => (
                        <div key={item.type} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{item.type}</span>
                            <span className="text-green-600">{Math.min(100, Math.round(item.accuracy))}%</span>
                          </div>
                          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.round(item.accuracy))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {strengthsData.weaknesses?.length > 0 && (
                  <Card>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <FiX className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Cần cải thiện</span>
                    </div>
                    <div className="space-y-3">
                      {strengthsData.weaknesses.slice(0, 3).map((item) => (
                        <div key={item.type} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{item.type}</span>
                            <span className="text-red-600">{Math.min(100, Math.round(item.accuracy))}%</span>
                          </div>
                          <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.round(item.accuracy))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Tests by Skill */}
            {analyticsSummary?.testsBySkill && Object.keys(analyticsSummary.testsBySkill).length > 0 && (
              <Card>
                <h3 className="font-semibold text-slate-900 mb-4">Bài thi theo kỹ năng</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(analyticsSummary.testsBySkill).map(([skill, count]) => (
                    <div
                      key={skill}
                      className="px-4 py-2 bg-slate-100 rounded-full text-sm"
                    >
                      <span className="font-medium text-slate-700">{skill}</span>
                      <span className="ml-2 text-slate-500">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Exam Recommendations based on weaknesses */}
            {recommendations.length > 0 && (
              <Card>
                <h3 className="font-semibold text-slate-900 mb-2">🎯 Bài tập đề xuất để cải thiện</h3>
                <p className="text-xs text-slate-500 mb-4">Dựa trên các dạng câu hỏi bạn cần cải thiện</p>
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <motion.button
                      key={rec.examId}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => router.push(`/practice?examId=${rec.examId}`)}
                      className="w-full p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:border-emerald-300 text-left transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{rec.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                              {rec.category}
                            </span>
                            <span className="text-xs text-slate-500">{rec.questionCount} câu</span>
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
                        <FiChevronRight className="w-5 h-5 text-emerald-600" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </Card>
            )}

            {/* Score Trend Chart */}
            {scoreTrend.length > 0 && (
              <Card>
                <h3 className="font-semibold text-slate-900 mb-4">📈 Xu hướng điểm số (30 ngày)</h3>
                <div className="h-40 flex items-end gap-1">
                  {scoreTrend.map((point, index) => {
                    const maxScore = Math.max(...scoreTrend.map(d => d.avgScore), 100);
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
                        {index % Math.ceil(scoreTrend.length / 5) === 0 && (
                          <span className="text-[9px] text-slate-400 whitespace-nowrap">
                            {new Date(point.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Recent Analytics Activity */}
            {recentAnalytics.length > 0 && (
              <Card>
                <h3 className="font-semibold text-slate-900 mb-4">Hoạt động gần đây</h3>
                <div className="space-y-3">
                  {recentAnalytics.slice(0, 5).map((activity, index) => (
                    <div
                      key={`${activity.examId}-${index}`}
                      className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {activity.type?.slice(0, 2) || "TE"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {activity.examTitle || "Bài kiểm tra"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(activity.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} • {activity.durationMin} phút
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
              </Card>
            )}
          </>
        )}
      </main>

    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      className="text-sm font-semibold text-white bg-blue-500 inline-block px-3 py-1 rounded-xl"
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.h2>
  );
}

function Card({
  children,
  hover,
}: {
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <motion.div
      className={`rounded-2xl bg-white p-4 shadow-sm ${
        hover ? "hover:shadow-lg" : ""
      }`}
      whileHover={{ y: hover ? -2 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] leading-none rounded-full px-2 py-1 bg-blue-50 text-blue-700 ">
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl  bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function MotionLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className="text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      {children}
    </motion.button>
  );
}

function SkeletonAttempt() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-6 w-16 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 bg-slate-100 rounded" />
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>
        <div className="h-8 w-28 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function SkeletonPlacement() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-64 bg-slate-100 rounded" />
            <div className="h-3 w-48 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function normalizeAttemptItem(item: any): Attempt {
  if (
    item?.attemptId &&
    item?.examId &&
    (item?.startedAt || item?.submittedAt)
  ) {
    const id = String(item.attemptId);
    const title = String(item.title || "Practice Attempt");
    const dateISO = item.submittedAt || item.startedAt;
    const durationMin = diffMinutesSafe(item.startedAt, item.submittedAt);
    let score: number | undefined = undefined;
    if (typeof item.scorePct === "number") score = Math.round(item.scorePct);
    const skill: Attempt["skill"] = "Reading";
    return { id, title, skill, dateISO, score, durationMin };
  }

  const id =
    item?.id ??
    item?.attemptId ??
    item?._id ??
    String(item?.uid ?? cryptoRandom());

  const title =
    item?.title ?? item?.paper?.title ?? item?.name ?? "Practice Attempt";

  const skillRaw =
    item?.skill ?? item?.section?.skill ?? item?.paper?.skill ?? "reading";
  const skill = toSkill(skillRaw);

  const dateISO =
    item?.finishedAt ??
    item?.submittedAt ??
    item?.createdAt ??
    item?.updatedAt ??
    new Date().toISOString();

  let score: number | undefined = undefined;
  if (typeof item?.score === "number") score = item.score;
  else if (typeof item?.bandScore === "number")
    score = Math.round(item.bandScore * 10);
  else if (typeof item?.awardedTotal === "number")
    score = Math.round(item.awardedTotal);
  else if (typeof item?.scorePct === "number")
    score = Math.round(item.scorePct);

  const durationMin =
    item?.durationMin ??
    diffMinutesSafe(item?.startedAt, item?.submittedAt) ??
    Math.max(
      1,
      Math.round(((item?.timeUsedSec ?? item?.durationSec ?? 0) as number) / 60)
    );

  return { id, title, skill, dateISO, score, durationMin };
}

function toSkill(s: string): Attempt["skill"] {
  const t = String(s || "").toLowerCase();
  if (t.includes("speak")) return "Speaking";
  if (t.includes("writ")) return "Writing";
  if (t.includes("listen")) return "Listening";
  return "Reading";
}

function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}p` : `${hours}h`;
}
