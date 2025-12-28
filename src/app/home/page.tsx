"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PenguinLottie from "@/components/PenguinLottie";
import {
  getAttempt,
  getMe,
  getPublicExams,
  startAttempt,
  getPlacementStatus,
  getWritingHistory,
  getSpeakingHistory,
  getAnalyticsSummary,
  getGamificationStats,
} from "@/utils/api";
import { useAttemptStore } from "../store/useAttemptStore";
import { useLoadingStore } from "../store/loading";
import {
  mapSpeakingHistoryToAttempt,
  mapWritingHistoryToAttempt,
} from "./components/utils";

// ====================================
// TYPES
// ====================================
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
  level: string;
  band: number;
};

// ====================================
// COMPONENTS
// ====================================

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

// Get greeting based on time of day
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Daily Tips (rotates daily)
const dailyTips = [
  "Practice 15 minutes of active listening daily for better comprehension.",
  "Read academic texts to expand your vocabulary for the IELTS exam.",
  "Record yourself speaking and listen back for pronunciation insights.",
  "Time yourself when writing to build exam-day confidence.",
  "Review your Phrasal Verbs today for Speaking Part 3.",
];

// ====================================
// MAIN PAGE COMPONENT
// ====================================
export default function Home() {
  const router = useRouter();
  const { setAttempt } = useAttemptStore();
  const { setLoading } = useLoadingStore();

  // State
  const [userName, setUserName] = useState("there");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [placementTestId, setPlacementTestId] = useState("");
  const [placementStatus, setPlacementStatus] = useState<PlacementStatus | null>(null);
  const [loadingPlacement, setLoadingPlacement] = useState(true);
  const [analytics, setAnalytics] = useState<{
    totalAttempts: number;
    totalStudyTimeMin: number;
    avgScore: number;
  } | null>(null);
  const [streak, setStreak] = useState(0);

  // Daily tip (changes each day)
  const dailyTip = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return dailyTips[dayOfYear % dailyTips.length];
  }, []);

  // Fetch user
  useEffect(() => {
    getMe()
      .then((res: any) => {
        const name = res?.data?.data?.name || res?.data?.name || "there";
        setUserName(name.split(" ")[0]);
      })
      .catch(() => {});
  }, []);

  // Fetch attempts and analytics
  useEffect(() => {
    (async () => {
      setLoadingAttempts(true);
      try {
        const [res, wres, sres, analyticsRes, gamificationRes] = await Promise.all([
          getAttempt(1, 10),
          getWritingHistory(),
          getSpeakingHistory(),
          getAnalyticsSummary().catch(() => null),
          getGamificationStats().catch(() => null),
        ]);

        const raw = (res as any)?.data?.items ?? (res as any)?.data?.data ?? [];
        const list: Attempt[] = Array.isArray(raw) ? raw.map(normalizeAttemptItem) : [];
        const wraw = (wres as any)?.data?.data ?? [];
        const writingList: Attempt[] = Array.isArray(wraw) ? wraw.map(mapWritingHistoryToAttempt) : [];
        const sraw = (sres as any)?.data?.data ?? [];
        const speakingList: Attempt[] = Array.isArray(sraw) ? sraw.map(mapSpeakingHistoryToAttempt) : [];
        const merged = [...list, ...writingList, ...speakingList];
        merged.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
        setAttempts(merged);

        const summaryData = (analyticsRes as any)?.data?.data ?? (analyticsRes as any)?.data;
        if (summaryData) setAnalytics(summaryData);

        const gamificationData = (gamificationRes as any)?.data?.data ?? (gamificationRes as any)?.data;
        if (gamificationData?.currentStreak !== undefined) {
          setStreak(gamificationData.currentStreak);
        }
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoadingAttempts(false);
      }
    })();
  }, []);

  // Fetch placement status
  useEffect(() => {
    (async () => {
      setLoadingPlacement(true);
      try {
        const [testsRes, statusRes] = await Promise.allSettled([
          getPublicExams(1, 100),
          getPlacementStatus(),
        ]);

        if (testsRes.status === "fulfilled") {
          const data = (testsRes.value as any)?.data?.data ?? (testsRes.value as any)?.data ?? [];
          const placement = Array.isArray(data)
            ? data.find((item: any) => String(item.title || "").includes("English Placement"))
            : null;
          if (placement?.id) setPlacementTestId(String(placement.id));
        }

        if (statusRes.status === "fulfilled") {
          const raw = (statusRes.value as any)?.data?.data ?? (statusRes.value as any)?.data ?? null;
          if (raw) {
            setPlacementStatus({
              completed: !!raw.completed,
              attemptId: String(raw.attemptId ?? ""),
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

  async function handleStartPlacement() {
    if (!placementTestId) return;
    try {
      setLoading(true);
      const res = await startAttempt(placementTestId);
      const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      const attemptId = payload?.attemptId ?? payload?.id;
      if (!attemptId) throw new Error("Missing attemptId");
      setAttempt(payload);
      router.push(`/placement/${attemptId}`);
    } catch (err) {
      console.error(err);
      alert("Unable to start test. Please try again!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* =============================================
            SECTION 1: HERO - Welcome Card with Animated Mascot
        ============================================= */}
        <section className="relative bg-white border border-blue-100 rounded-2xl p-8 md:p-12 shadow-sm flex flex-col-reverse md:flex-row items-center justify-between gap-8 overflow-hidden">
          
          {/* LEFT SIDE: Text Content */}
          <div className="flex-1 space-y-6 z-10">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-slate-800 font-bold mb-2">
                {getGreeting()}, <span className="text-[#3B82F6]">{userName}</span>!
              </h1>
              <p className="text-slate-500 text-lg">
                Ready to continue your IELTS journey? Let&apos;s make today count.
              </p>
            </div>

            {/* Tip Bubble - Soft Blue Theme */}
            <div className="inline-flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] p-4 rounded-xl max-w-lg">
              <Icon name="lightbulb" className="text-[#3B82F6] text-xl mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-1">Tip of the Day</span>
                <p className="text-[#1E40AF] text-sm leading-relaxed">
                  {dailyTip}
                </p>
              </div>
            </div>

            {/* Primary Action */}
            <div className="pt-2">
              <button 
                onClick={() => router.push("/practice")}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-3 rounded-lg font-medium shadow-sm transition-all hover:shadow-md flex items-center gap-2"
              >
                <span>Resume Learning</span>
                <Icon name="arrow_forward" className="text-lg" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Animated 3D Penguin Mascot (Lottie) */}
          <div className="relative w-full md:w-auto flex justify-center md:justify-end">
            {/* Decor Blob - creates depth behind penguin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-60"></div>
            
            {/* THE LOTTIE ANIMATION */}
            <div className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56">
              <PenguinLottie />
            </div>
          </div>

        </section>

        {/* =============================================
            SECTION 2: PLACEMENT TEST ALERT
        ============================================= */}
        {!loadingPlacement && !placementStatus?.completed && placementTestId && (
          <section className="flex items-center justify-between p-5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center">
                <Icon name="quiz" className="text-xl text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1E293B]">Take Your Placement Test</p>
                <p className="text-sm text-[#475569]">
                  Let us assess your level to personalize your learning path.
                </p>
              </div>
            </div>
            <button
              onClick={handleStartPlacement}
              className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Start Now
            </button>
          </section>
        )}

        {/* Placement Complete Badge */}
        {!loadingPlacement && placementStatus?.completed && (
          <section className="flex items-center justify-between p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                <Icon name="verified" className="text-xl text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1E293B]">Placement Complete</p>
                <p className="text-sm text-[#475569]">
                  Level: <strong>{placementStatus.level || "N/A"}</strong>
                  {placementStatus.band > 0 && (
                    <span className="ml-2">
                      • Band <strong>{placementStatus.band.toFixed(1)}</strong>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/attempts/${placementStatus.attemptId}?source=attempt`)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              View Report <Icon name="arrow_forward" className="text-base" />
            </button>
          </section>
        )}

        {/* =============================================
            SECTION 3: PRACTICE GRID
        ============================================= */}
        <section className="space-y-5">
          <h2 className="font-serif text-2xl font-bold text-[#1E293B]">Practice Skills</h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkillCard
              icon="menu_book"
              title="Reading"
              description="Comprehension & scanning"
              onClick={() => router.push("/practice?skill=reading")}
            />
            <SkillCard
              icon="headphones"
              title="Listening"
              description="Audio practice tests"
              onClick={() => router.push("/practice?skill=listening")}
            />
            <SkillCard
              icon="edit_note"
              title="Writing"
              description="Essay & task practice"
              onClick={() => router.push("/writing")}
            />
            <SkillCard
              icon="mic"
              title="Speaking"
              description="Interview simulation"
              onClick={() => router.push("/speaking")}
            />
          </div>
        </section>

        {/* =============================================
            SECTION 4: QUICK ACTIONS
        ============================================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            icon="style"
            title="Flashcards"
            description="Review vocabulary"
            onClick={() => router.push("/flashcards")}
          />
          <QuickAction
            icon="bookmark"
            title="Bookmarks"
            description="Saved questions"
            onClick={() => router.push("/bookmarks")}
          />
          <QuickAction
            icon="history"
            title="History"
            description="Past attempts"
            onClick={() => router.push("/history")}
          />
          <QuickAction
            icon="bar_chart"
            title="Analytics"
            description="Your progress"
            onClick={() => router.push("/analytics")}
          />
        </section>

        {/* =============================================
            SECTION 5: ANALYTICS SUMMARY STATS
        ============================================= */}
        {analytics && analytics.totalAttempts > 0 && (
          <section className="space-y-5">
            <h2 className="font-serif text-2xl font-bold text-[#1E293B]">Your Progress</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Tests Taken" value={analytics.totalAttempts} icon="assignment" />
              <StatCard label="Average Score" value={`${analytics.avgScore.toFixed(0)}%`} icon="trending_up" highlight />
              <StatCard label="Study Time" value={formatTime(analytics.totalStudyTimeMin)} icon="schedule" />
              <StatCard label="Day Streak" value={`${streak} days`} icon="local_fire_department" />
            </div>
          </section>
        )}

        {/* =============================================
            SECTION 6: RECENT ACTIVITY TABLE
        ============================================= */}
        {attempts.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-[#1E293B]">Recent Activity</h2>
              <button
                onClick={() => router.push("/history")}
                className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-semibold flex items-center gap-1"
              >
                View All <Icon name="arrow_forward" className="text-base" />
              </button>
            </div>

            {/* Classic Data Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Skill
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Score
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.slice(0, 5).map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-sm text-[#64748B]">{formatDate(attempt.dateISO)}</td>
                      <td className="px-5 py-4">
                        <SkillBadge skill={attempt.skill} />
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-[#1E293B]">{attempt.title}</td>
                      <td className="px-5 py-4">
                        {attempt.score !== undefined ? (
                          <ScoreBadge score={attempt.score} />
                        ) : (
                          <span className="text-sm text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => router.push(buildAttemptUrl(attempt))}
                          className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ====================================
// SKILL CARD COMPONENT
// ====================================
function SkillCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-[#3B82F6] hover:ring-2 hover:ring-[#3B82F6]/20 text-left transition-all duration-200 shadow-sm"
    >
      <Icon name={icon} className="text-4xl text-[#3B82F6] mb-4" />
      <h3 className="font-serif font-bold text-lg text-[#1E293B]">{title}</h3>
      <p className="text-sm text-[#64748B] mt-1">{description}</p>
      <div className="mt-4 flex justify-end">
        <Icon
          name="arrow_forward"
          className="text-xl text-[#CBD5E1] group-hover:text-[#3B82F6] transition-colors"
        />
      </div>
    </button>
  );
}

// ====================================
// QUICK ACTION CARD COMPONENT
// ====================================
function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md text-left transition-all duration-200"
    >
      <Icon name={icon} className="text-2xl text-[#3B82F6] mb-3" />
      <h3 className="font-semibold text-[#1E293B] text-sm">{title}</h3>
      <p className="text-xs text-[#64748B] mt-0.5">{description}</p>
    </button>
  );
}

// ====================================
// STAT CARD COMPONENT
// ====================================
function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-5 rounded-xl border shadow-sm ${
        highlight
          ? "bg-[#EFF6FF] border-[#BFDBFE]"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">{label}</p>
        <Icon name={icon} className={`text-xl ${highlight ? "text-[#3B82F6]" : "text-[#94A3B8]"}`} />
      </div>
      <p
        className={`text-2xl font-bold ${
          highlight ? "text-[#2563EB]" : "text-[#1E293B]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ====================================
// SKILL BADGE COMPONENT
// ====================================
function SkillBadge({ skill }: { skill: string }) {
  const colors: Record<string, string> = {
    Reading: "bg-blue-50 text-blue-700",
    Listening: "bg-purple-50 text-purple-700",
    Writing: "bg-amber-50 text-amber-700",
    Speaking: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
        colors[skill] || "bg-slate-50 text-slate-700"
      }`}
    >
      {skill}
    </span>
  );
}

// ====================================
// SCORE BADGE COMPONENT
// ====================================
function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return "bg-emerald-50 text-emerald-700";
    if (score >= 50) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  };

  return (
    <span className={`inline-block px-2.5 py-1 text-sm font-semibold rounded-full ${getColor()}`}>
      {score}%
    </span>
  );
}

// ====================================
// HELPER FUNCTIONS
// ====================================
function normalizeAttemptItem(item: any): Attempt {
  return {
    id: item.attemptId ?? item.id ?? "",
    title: item.examTitle ?? item.title ?? "Practice Test",
    skill: item.skill ?? "Reading",
    dateISO: item.finishedAt ?? item.startedAt ?? new Date().toISOString(),
    score: item.score ?? item.correctPercent,
    durationMin: item.durationMin ?? Math.round((item.timeUsedSec ?? 0) / 60),
  };
}

function buildAttemptUrl(a: Attempt) {
  if (a.skill === "Writing") return `/attempts/${a.id}?source=writing`;
  if (a.skill === "Speaking") return `/attempts/${a.id}?source=speaking`;
  return `/attempts/${a.id}?source=attempt`;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
