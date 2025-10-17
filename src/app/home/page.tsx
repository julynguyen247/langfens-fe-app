// app/home/page.tsx
"use client";

import { useMemo } from "react";

type Course = {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  progress: number; // 0..100
  lessonsDone: number;
  lessonsTotal: number;
};

type Attempt = {
  id: string;
  title: string;
  skill: "Reading" | "Listening" | "Writing";
  dateISO: string;
  score?: number; // 0..100, undefined nếu chưa chấm
  durationMin: number;
};

export default function Home() {
  // ---- Mock data ----
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

  const attempts: Attempt[] = [
    {
      id: "a101",
      title: "TOEIC RC Mini Test #03",
      skill: "Reading",
      dateISO: "2025-10-15T19:30:00+07:00",
      score: 82,
      durationMin: 38,
    },
    {
      id: "a102",
      title: "IELTS Listening Section 2",
      skill: "Listening",
      dateISO: "2025-10-14T21:10:00+07:00",
      score: 71,
      durationMin: 29,
    },
    {
      id: "a103",
      title: "Writing Task 2 – Education",
      skill: "Writing",
      dateISO: "2025-10-13T09:10:00+07:00",
      durationMin: 42, // chưa chấm điểm
    },
  ];

  // ---- Simple analytics from attempts ----
  const analytics = useMemo(() => {
    const total = attempts.length;
    const graded = attempts.filter((a) => typeof a.score === "number");
    const avg =
      graded.reduce((s, a) => s + (a.score || 0), 0) / (graded.length || 1);
    const streakDays = 5; // ví dụ
    return { total, avg: Math.round(avg), streakDays };
  }, [attempts]);

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <main className="mx-auto max-w-6xl p-4 sm:p-6 space-y-8">
        {/* ---------------------- My Courses ---------------------- */}
        <SectionTitle> Các khóa học của tôi </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                    {c.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {c.level} • {c.lessonsDone}/{c.lessonsTotal} bài học
                  </p>
                </div>
                <span className="text-xs rounded-full px-2 py-1 bg-slate-100 text-slate-700">
                  {c.progress}%
                </span>
              </div>

              <Progress value={c.progress} className="mt-3" />

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-slate-500">Tiến độ khóa học</div>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Tiếp tục học →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ---------------------- Attempt History ---------------------- */}
        <SectionTitle> Lịch sử làm bài </SectionTitle>
        <div className="space-y-3">
          {attempts.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge>{a.skill}</Badge>
                  <div>
                    <div className="font-medium text-slate-800">{a.title}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(a.dateISO)} • {a.durationMin} phút
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {typeof a.score === "number" ? (
                    <span className="text-sm font-semibold text-emerald-600">
                      Điểm: {a.score}
                    </span>
                  ) : (
                    <span className="text-sm text-amber-600">Chưa chấm</span>
                  )}
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ---------------------- Analytics ---------------------- */}
        <SectionTitle> Phân tích dữ liệu </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Tổng số bài đã làm" value={analytics.total} />
          <StatCard label="Điểm trung bình" value={`${analytics.avg}`} />
          <StatCard
            label="Chuỗi ngày học"
            value={`${analytics.streakDays} ngày`}
          />
        </div>

        {/* Mini spark bars (fake) */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-800">
            Tiến bộ gần đây
          </div>
          <div className="mt-3 flex items-end gap-1 h-24">
            {[42, 55, 61, 38, 74, 80, 67, 88, 71, 92, 77, 84].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, background: "rgb(59 130 246 / 0.6)" }}
                title={`${h}`}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            *Cột càng cao biểu thị kết quả tốt hơn (dữ liệu minh họa).
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------------- UI Bits ---------------------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-blue-700">{children}</h2>;
}

function Progress({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={`w-full h-2 rounded-full bg-slate-100 ${className}`}>
      <div
        className="h-2 rounded-full bg-blue-600 transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
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
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
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
