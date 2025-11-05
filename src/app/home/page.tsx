"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAttempt, getMe } from "@/utils/api";

type Course = {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  progress: number;
  lessonsDone: number;
  lessonsTotal: number;
};

type Attempt = {
  id: string;
  title: string;
  skill: "Reading" | "Listening" | "Writing";
  dateISO: string;
  score?: number;
  durationMin: number;
};

export default function Home() {
  const router = useRouter();

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

  useEffect(() => {
    getMe().catch(() => {});
    (async () => {
      setLoadingAttempts(true);
      setAttemptErr(null);
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
        setAttempts(list);
      } catch (e: any) {
        setAttemptErr(e?.message || "Không thể tải lịch sử làm bài.");
      } finally {
        setLoadingAttempts(false);
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <HeroHeader />

        <SectionTitle> Các khóa học của tôi </SectionTitle>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          {courses.map((c, i) => (
            <motion.div key={c.id} variants={fadeInUp}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                      {c.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {c.level} • {c.lessonsDone}/{c.lessonsTotal} bài học
                    </p>
                  </div>
                  <span className="text-xs rounded-full px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200">
                    {c.progress}%
                  </span>
                </div>
                <Progress value={c.progress} className="mt-4" />
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-500">Tiến độ khóa học</div>
                  <MotionButton onClick={() => {}}>Tiếp tục học</MotionButton>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <SectionTitle> Lịch sử làm bài </SectionTitle>
        <AnimatePresence mode="popLayout">
          {loadingAttempts ? (
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
          ) : attemptErr ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-rose-600"
            >
              {attemptErr}
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
              {attempts.map((a) => (
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
                          onClick={() => router.push(`/attempts/${a.id}`)}
                        >
                          Xem chi tiết
                        </MotionLink>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
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

function HeroHeader() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 sm:p-8 shadow-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Xin chào, chúc bạn học tốt hôm nay!
          </h1>
          <p className="mt-1 text-white/90 text-sm">
            Tiếp tục chuỗi luyện tập của bạn và chinh phục mục tiêu IELTS.
          </p>
        </div>
        <MotionButton
          variant="light"
          onClick={() => {
            router.replace("/practice");
          }}
        >
          Bắt đầu luyện tập
        </MotionButton>
      </div>
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      className="text-sm font-semibold text-white bg-blue-500 inline-block px-3 py-1 rounded-xl "
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
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        hover ? "hover:shadow-lg" : ""
      }`}
      whileHover={{ y: hover ? -2 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

function Progress({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full h-2 rounded-full bg-slate-100 ${className}`}>
      <motion.div
        className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 0.6 }}
      />
    </div>
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

function MotionButton({
  children,
  onClick,
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "light";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition";
  const solid = "bg-white text-blue-700 hover:bg-blue-50";
  const light = "bg-white/10 text-white hover:bg-white/15";
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${base} ${variant === "solid" ? solid : light}`}
    >
      {children}
    </motion.button>
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
    const examId = String(item.examId);
    const title = String(item.title);
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
  if (t.startsWith("read")) return "Reading";
  if (t.startsWith("listen")) return "Listening";
  if (t.startsWith("writ")) return "Writing";
  return "Reading";
}

function diffMinutesSafe(start?: string, end?: string): number {
  try {
    const s = start ? new Date(start).getTime() : NaN;
    const e = end ? new Date(end).getTime() : NaN;
    if (!isFinite(s) || !isFinite(e)) return 1;
    const diffMs = Math.max(0, e - s);
    return Math.max(1, Math.round(diffMs / 60000));
  } catch {
    return 1;
  }
}

function shortId(id: string, n = 8) {
  return id.length > n ? id.slice(0, n) : id;
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 10);
}

const staggerContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const staggerBar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

function barItem(h: number) {
  return {
    hidden: { height: 0, opacity: 0 },
    show: { height: `${h}%`, opacity: 1, transition: { duration: 0.5 } },
  };
}
