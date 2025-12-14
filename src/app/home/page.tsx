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
} from "@/utils/api";
import { FiPlay } from "react-icons/fi";
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

  const [coreAttempts, setCoreAttempts] = useState<Attempt[]>([]);
  const [writingAttempts, setWritingAttempts] = useState<Attempt[]>([]);
  const [speakingAttempts, setSpeakingAttempts] = useState<Attempt[]>([]);

  const [loadingCore, setLoadingCore] = useState(true);
  const [loadingWriting, setLoadingWriting] = useState(false);
  const [loadingSpeaking, setLoadingSpeaking] = useState(false);

  const [coreErr, setCoreErr] = useState<string | null>(null);

  const [showAllHistory, setShowAllHistory] = useState(false);

  const [placementTestId, setPlacementTestId] = useState("");
  const [placementStatus, setPlacementStatus] =
    useState<PlacementStatus | null>(null);
  const [loadingPlacement, setLoadingPlacement] = useState(true);

  useEffect(() => {
    let alive = true;

    getMe().catch(() => {});

    (async () => {
      setLoadingCore(true);
      setCoreErr(null);

      try {
        const res = await getAttempt(1, 10);
        const raw =
          (res as any)?.data?.items ??
          (res as any)?.data?.data ??
          (res as any)?.data ??
          [];

        const list: Attempt[] = Array.isArray(raw)
          ? raw.map(normalizeAttemptItem)
          : [];

        if (!alive) return;
        setCoreAttempts(list);
      } catch (e: any) {
        if (!alive) return;
        setCoreErr(e?.message || "Không thể tải lịch sử làm bài.");
      } finally {
        if (!alive) return;
        setLoadingCore(false);
      }
    })();

    (async () => {
      setLoadingWriting(true);
      try {
        const wres = await getWritingHistory();
        const wraw = (wres as any)?.data?.data ?? [];
        const list: Attempt[] = Array.isArray(wraw)
          ? wraw.map(mapWritingHistoryToAttempt)
          : [];
        if (!alive) return;
        setWritingAttempts(list);
      } catch {
        if (!alive) return;
        setWritingAttempts([]);
      } finally {
        if (!alive) return;
        setLoadingWriting(false);
      }
    })();

    (async () => {
      setLoadingSpeaking(true);
      try {
        const sres = await getSpeakingHistory();
        const sraw = (sres as any)?.data?.data ?? [];
        const list: Attempt[] = Array.isArray(sraw)
          ? sraw.map(mapSpeakingHistoryToAttempt)
          : [];
        if (!alive) return;
        setSpeakingAttempts(list);
      } catch {
        if (!alive) return;
        setSpeakingAttempts([]);
      } finally {
        if (!alive) return;
        setLoadingSpeaking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingPlacement(true);
      try {
        const [testsRes, statusRes] = await Promise.allSettled([
          getPublicExams(1, 24),
          getPlacementStatus(),
        ]);

        if (!alive) return;

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
        if (!alive) return;
        setLoadingPlacement(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const attempts = useMemo(() => {
    const merged = [...coreAttempts, ...writingAttempts, ...speakingAttempts];
    merged.sort(
      (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
    );
    return merged;
  }, [coreAttempts, writingAttempts, speakingAttempts]);

  const analytics = useMemo(() => {
    const total = attempts.length;
    const graded = attempts.filter((a) => typeof a.score === "number");
    const avg =
      graded.reduce((s, a) => s + (a.score || 0), 0) / (graded.length || 1);
    const streakDays = 5;
    return { total, avg: Math.round(avg), streakDays };
  }, [attempts]);

  const visibleAttempts = useMemo(() => {
    return showAllHistory ? attempts : attempts.slice(0, 3);
  }, [attempts, showAllHistory]);

  const extraLoading = loadingWriting || loadingSpeaking;

  const skeletonFillCount = useMemo(() => {
    if (showAllHistory) return 0;
    if (!extraLoading) return 0;
    const need = 3 - visibleAttempts.length;
    return need > 0 ? need : 0;
  }, [showAllHistory, extraLoading, visibleAttempts.length]);

  async function handleStart(id: string) {
    try {
      const res = await startAttempt(id);
      const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      const attemptId: string | undefined = payload?.attemptId ?? payload?.id;
      if (!attemptId) throw new Error("Missing attemptId");
      setAttempt(payload);
      router.push(`/placement/${attemptId}`);
    } catch (err) {
      console.error(err);
      alert("Không thể bắt đầu bài. Vui lòng thử lại!");
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
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!placementTestId}
                  >
                    Bắt đầu làm
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between gap-3">
          <SectionTitle> Lịch sử làm bài </SectionTitle>

          {!loadingCore && !coreErr && attempts.length > 3 && (
            <motion.button
              whileHover={{ y: -1 }}
              onClick={() => setShowAllHistory((s) => !s)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {showAllHistory ? "Thu gọn" : "Xem tất cả"}
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {loadingCore ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-3"
            >
              <SkeletonAttempt />
              <SkeletonAttempt />
              <SkeletonAttempt />
            </motion.div>
          ) : coreErr ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-rose-600"
            >
              {coreErr}
            </motion.div>
          ) : attempts.length === 0 && extraLoading ? (
            <motion.div
              key="extra-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-3"
            >
              <SkeletonAttempt />
              <SkeletonAttempt />
              <SkeletonAttempt />
            </motion.div>
          ) : attempts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-500"
            >
              Chưa có lịch sử làm bài.
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-3"
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {visibleAttempts.map((a) => (
                <motion.div key={a.id} variants={fadeInUp}>
                  <Card hover>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge>{a.skill}</Badge>
                        <div>
                          <div className="font-medium text-slate-900">
                            {a.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(a.dateISO)} • {a.durationMin} phút
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {typeof a.score === "number" && (
                          <span className="text-sm font-semibold text-blue-700">
                            {a.score}
                          </span>
                        )}
                        <MotionLink
                          onClick={() => router.push(buildAttemptDetailUrl(a))}
                        >
                          Xem chi tiết
                        </MotionLink>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {Array.from({ length: skeletonFillCount }).map((_, i) => (
                <motion.div key={`sk-fill-${i}`} variants={fadeInUp}>
                  <SkeletonAttempt />
                </motion.div>
              ))}

              {!showAllHistory && extraLoading && (
                <motion.div
                  variants={fadeInUp}
                  className="text-xs text-slate-500 pt-1"
                >
                  Đang tải thêm lịch sử Writing và Speaking...
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <SectionTitle> Phân tích dữ liệu </SectionTitle>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <StatCard label="Tổng số bài đã làm" value={analytics.total} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard label="Điểm trung bình" value={`${analytics.avg}`} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Chuỗi ngày học"
              value={`${analytics.streakDays} ngày`}
            />
          </motion.div>
        </motion.div>

        <Card>
          <div className="text-sm font-medium text-slate-900">
            Tiến bộ gần đây
          </div>
          <motion.div
            className="mt-4 flex items-end gap-1 h-28"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerBar}
          >
            {[42, 55, 61, 38, 74, 80, 67, 88, 71, 92, 77, 84].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t bg-blue-500/70"
                variants={barItem(h)}
                title={`${h}`}
              />
            ))}
          </motion.div>
          <div className="mt-2 text-xs text-slate-500">
            *Cột càng cao biểu thị kết quả tốt hơn (dữ liệu minh họa).
          </div>
        </Card>
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
    <span className="text-[11px] leading-none rounded-full px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100">
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
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
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
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
