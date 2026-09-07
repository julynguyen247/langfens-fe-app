"use client";

// Redesigned Test History page.
// Sections (top → bottom):
//   1. Header band with predicted-band ruler
//   2. Stats strip (4 cards)
//   3. Score trend mini-chart
//   4. Filter bar (skill / time / exam / sort + clear)
//   5. Test list
//   6. Empty state
//   7. Loading / error states handled inline

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  getAttempt,
  getWritingHistory,
  getSpeakingHistory,
  getAnalyticsSummary,
  getScoreTrend,
  getPredictedBand,
} from "@/utils/api";

import { AttemptCard } from "./_components/AttemptCard";
import { BandRuler } from "./_components/BandRuler";
import { EmptyState } from "./_components/EmptyState";
import {
  FilterBar,
  type ExamTypeFilter,
  type SkillTabKey,
  type SortKey,
  type TimeRangeKey,
} from "./_components/FilterBar";
import { ScoreTrendChart, type TrendSeries } from "./_components/ScoreTrendChart";
import { SkeletonList } from "./_components/SkeletonList";
import { StatCard } from "./_components/StatCard";
import {
  effectiveBand,
  formatBand,
  normaliseSkill,
  type AttemptRecord,
  type SkillKey,
} from "./_lib/utils";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  // Loaded datasets
  const [readingAttempts, setReadingAttempts] = useState<AttemptRecord[]>([]);
  const [writingAttempts, setWritingAttempts] = useState<AttemptRecord[]>([]);
  const [speakingAttempts, setSpeakingAttempts] = useState<AttemptRecord[]>([]);
  const [trend, setTrend] = useState<TrendSeries[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<{
    totalAttempts: number | null;
    avgScore: number | null;
  } | null>(null);
  const [predictedBand, setPredictedBand] = useState<number | null>(null);

  // UI state
  const [activeSkill, setActiveSkill] = useState<SkillTabKey>("reading");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [examType, setExamType] = useState<ExamTypeFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  // Lifecycle
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [readingRes, writingRes, speakingRes, trendRes, summaryRes, predictedRes] =
          await Promise.all([
            getAttempt(1, 50).catch(() => null),
            getWritingHistory().catch(() => null),
            getSpeakingHistory().catch(() => null),
            getScoreTrend(30).catch(() => null),
            getAnalyticsSummary().catch(() => null),
            getPredictedBand().catch(() => null),
          ]);

        if (cancelled) return;

        setReadingAttempts(parseReading(readingRes));
        setWritingAttempts(parseWriting(writingRes));
        setSpeakingAttempts(parseSpeaking(speakingRes));
        setTrend(parseTrend(trendRes));
        setSummaryCounts(parseSummary(summaryRes));
        setPredictedBand(parsePredicted(predictedRes));
      } catch (e) {
        if (!cancelled) {
          const msg =
            e && typeof e === "object" && "message" in e
              ? String(e.message ?? "Failed to load history")
              : "Failed to load history";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  // -------------------------------------------------------------------------
  // Derived: filtered + sorted list for current tab
  // -------------------------------------------------------------------------
  const allForCurrentTab: AttemptRecord[] = useMemo(() => {
    if (activeSkill === "reading") return readingAttempts;
    if (activeSkill === "writing") return writingAttempts;
    return speakingAttempts;
  }, [activeSkill, readingAttempts, writingAttempts, speakingAttempts]);

  const filtered = useMemo(() => {
    const cutoff = timeRangeCutoff(timeRange);
    let list = allForCurrentTab.filter((item) => {
      if (cutoff != null) {
        const ts = item.finishedAt ? new Date(item.finishedAt).getTime() : 0;
        if (!ts || ts < cutoff) return false;
      }
      if (examType !== "all") {
        const tag = item.examType;
        if (examType === "academic" && !isAcademic(tag)) return false;
        if (examType === "general" && !isGeneral(tag)) return false;
      }
      return true;
    });

    if (sort === "highest") {
      list = [...list].sort((a, b) => bandValue(b) - bandValue(a));
    } else if (sort === "lowest") {
      list = [...list].sort((a, b) => bandValue(a) - bandValue(b));
    } else {
      list = [...list].sort((a, b) => ts(b) - ts(a));
    }
    return list;
  }, [allForCurrentTab, timeRange, examType, sort]);

  // -------------------------------------------------------------------------
  // Derived: stats across ALL skills (for the top strip)
  // -------------------------------------------------------------------------
  const stats = useMemo(() => {
    const all = [...readingAttempts, ...writingAttempts, ...speakingAttempts];
    const totalAttempts =
      summaryCounts?.totalAttempts != null
        ? summaryCounts.totalAttempts
        : all.length;
    const scoresWithBand = all
      .map((a) => effectiveBand(a))
      .filter((v): v is number => v != null && !Number.isNaN(v));
    const avgBand =
      scoresWithBand.length > 0
        ? scoresWithBand.reduce((s, v) => s + v, 0) / scoresWithBand.length
        : null;
    const bestBand = scoresWithBand.length > 0 ? Math.max(...scoresWithBand) : null;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const testsThisWeek = all.filter((a) => {
      if (!a.finishedAt) return false;
      const t = new Date(a.finishedAt).getTime();
      return !Number.isNaN(t) && t >= oneWeekAgo;
    }).length;

    return { totalAttempts, avgBand, bestBand, testsThisWeek };
  }, [readingAttempts, writingAttempts, speakingAttempts, summaryCounts]);

  // Tab counts (unfiltered) drive the badges in the filter bar.
  const counts = useMemo(
    () => ({
      reading: readingAttempts.length,
      writing: writingAttempts.length,
      speaking: speakingAttempts.length,
    }),
    [readingAttempts, writingAttempts, speakingAttempts]
  );

  const hasActiveFilters = timeRange !== "all" || examType !== "all" || sort !== "newest";

  function clearFilters() {
    setTimeRange("all");
    setExamType("all");
    setSort("newest");
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const headerSkill = activeSkill; // for AttemptCard `source` prop

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 1. HEADER BAND */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 sm:p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <div className="lg:flex-1">
              <h1
                className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Test History
              </h1>
              <p
                className="text-sm text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Review every IELTS attempt you've taken — band scores, accuracy, dates and trends.
              </p>
            </div>

            {/* Predicted band ruler block */}
            <div className="lg:w-[460px] flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <p
                  className="text-[11px] font-bold text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Predicted band (IELTS 1.0–9.0)
                </p>
                <p
                  className="text-sm text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-code)" }}
                >
                  {predictedBand != null
                    ? `Predicted band: ${formatBand(predictedBand)}`
                    : "No prediction yet"}
                </p>
              </div>
              {loading ? (
                <div className="h-10 w-full rounded-full bg-[var(--border)] animate-pulse" />
              ) : (
                <BandRuler predictedBand={predictedBand} />
              )}
            </div>
          </div>
        </motion.section>

        {/* 2. STATS STRIP */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total attempts"
            value={stats.totalAttempts}
            numeric
            loading={loading}
            subLabel={
              !loading && summaryCounts?.totalAttempts != null
                ? `Across all skills`
                : undefined
            }
          />
          <StatCard
            label="Average band"
            value={stats.avgBand != null ? formatBand(stats.avgBand) : "—"}
            numeric
            loading={loading}
            subLabel={!loading && stats.avgBand != null ? bandDescriptorShort(stats.avgBand) : undefined}
          />
          <StatCard
            label="Best band"
            value={stats.bestBand != null ? formatBand(stats.bestBand) : "—"}
            numeric
            loading={loading}
            subLabel={!loading && stats.bestBand != null ? bandDescriptorShort(stats.bestBand) : undefined}
          />
          <StatCard
            label="Tests this week"
            value={stats.testsThisWeek}
            numeric
            loading={loading}
            subLabel={!loading ? "Past 7 days" : undefined}
          />
        </section>

        {/* 3. SCORE TREND */}
        <section className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2
              className="text-xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Score trend — last 30 days
            </h2>
          </div>
          {loading ? (
            <div className="h-[160px] w-full rounded-2xl bg-[var(--border)] animate-pulse" />
          ) : (
            <ScoreTrendChart series={trend} />
          )}
        </section>

        {/* 4. FILTER BAR */}
        <section className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 sm:p-6">
          <FilterBar
            activeSkill={activeSkill}
            counts={counts}
            onSkillChange={setActiveSkill}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            examType={examType}
            onExamTypeChange={setExamType}
            sort={sort}
            onSortChange={setSort}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </section>

        {/* 5. TEST LIST */}
        <section className="space-y-4">
          {error && !loading && (
            <div className="bg-red-50 border-[3px] border-red-200 rounded-[2rem] p-6 text-center">
              <p
                className="text-sm font-bold text-[var(--destructive)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <SkeletonList />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant={allForCurrentTab.length === 0 ? "no-data" : "no-matches"}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((item, idx) => (
                <AttemptCard
                  key={item.id}
                  attempt={item}
                  source={headerSkill}
                  index={idx}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(item: AttemptRecord): number {
  if (!item.finishedAt) return 0;
  const t = new Date(item.finishedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function bandValue(item: AttemptRecord): number {
  return effectiveBand(item) ?? -1;
}

function timeRangeCutoff(range: TimeRangeKey): number | null {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (range === "7d") return now - 7 * day;
  if (range === "30d") return now - 30 * day;
  if (range === "90d") return now - 90 * day;
  return null;
}

function bandDescriptorShort(band: number): string {
  const b = Math.round(band * 2) / 2;
  if (b >= 7.0) return "On track";
  if (b >= 5.5) return "Building";
  if (b >= 4.0) return "Growing";
  return "Just starting";
}

function isAcademic(tag: unknown): boolean {
  if (tag == null) return false;
  const s = String(tag).toLowerCase();
  if (s.includes("academic") || s === "ac") return true;
  if (typeof tag === "number" && tag === 0) return true;
  return false;
}

function isGeneral(tag: unknown): boolean {
  if (tag == null) return false;
  const s = String(tag).toLowerCase();
  if (s.includes("general") || s === "gt") return true;
  if (typeof tag === "number" && tag === 1) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Response parsers — defensive over multiple backend shapes.
// ---------------------------------------------------------------------------

function pickItems(res: unknown): unknown[] {
  if (!res || typeof res !== "object") return [];
  const r = res as Record<string, unknown>;
  const innerData = (r.data as { data?: unknown } | undefined)?.data;
  const d = innerData ?? r.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;
    for (const k of ["items", "data", "result"]) {
      if (Array.isArray(obj[k])) return obj[k] as unknown[];
    }
  }
  return [];
}
function numField(o: unknown, ...keys: string[]): number | null {
  for (const k of keys) {
    if (!o || typeof o !== "object") continue;
    const v = (o as Record<string, unknown>)[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return null;
}

function strField(o: unknown, ...keys: string[]): string | null {
  for (const k of keys) {
    if (!o || typeof o !== "object") continue;
    const v = (o as Record<string, unknown>)[k];
    if (typeof v === "string") return v;
  }
  return null;
}

function idField(o: unknown): string {
  for (const k of ["id", "attemptId", "submissionId", "_id"]) {
    if (!o || typeof o !== "object") continue;
    const v = (o as Record<string, unknown>)[k];
    if (typeof v === "string" || typeof v === "number") return String(v);
  }
  return "";
}

function parseReading(res: unknown): AttemptRecord[] {
  return pickItems(res).map((item) => {
    const skill: SkillKey =
      (normaliseSkill(typeof (item as Record<string, unknown>)["skill"] === "string"
        ? ((item as Record<string, unknown>)["skill"] as string)
        : undefined) ??
        ((item as Record<string, unknown>)["category"] === "LISTENING"
          ? "listening"
          : "reading")) as SkillKey;
    return {
      id: idField(item),
      skill,
      examTitle: strField(item, "title", "examTitle") ?? "IELTS Reading",
      status: strField(item, "status") ?? "GRADED",
      bandScore: numField(item, "ieltsBand", "bandScore"),
      correctCount: numField(item, "correctCount", "correct"),
      totalQuestions: numField(item, "totalQuestions", "totalPoints"),
      finishedAt: strField(item, "submittedAt", "finishedAt", "gradedAt"),
      startedAt: strField(item, "startedAt"),
      examType: strField(item, "examType") ?? strField(item, "level"),
      level: strField(item, "level"),
      timeSpentSeconds: numField(
        item,
        "timeSpentSeconds",
        "timeSpentSec",
        "elapsedSec"
      ),
    };
  });
}

function parseWriting(res: unknown): AttemptRecord[] {
  return pickItems(res).map((item) => ({
    id: idField(item),
    skill: "writing" as SkillKey,
    examTitle: strField(item, "title", "examTitle") ?? "Writing task",
    status: strField(item, "status") ?? "GRADED",
    overallBand: numField(item, "overallBand", "bandScore"),
    writingBand: numField(item, "writingBand"),
    finishedAt: strField(item, "submittedAt", "gradedAt", "createdAt"),
    startedAt: strField(item, "startedAt"),
    examType: strField(item, "examType") ?? strField(item, "level"),
    level: strField(item, "level"),
    timeSpentSeconds: numField(item, "timeSpentSeconds"),
  }));
}

function parseSpeaking(res: unknown): AttemptRecord[] {
  return pickItems(res).map((item) => ({
    id: idField(item),
    skill: "speaking" as SkillKey,
    examTitle: strField(item, "title", "examTitle") ?? "Speaking test",
    status: strField(item, "status") ?? "GRADED",
    overallBand: numField(item, "overallBand", "bandScore"),
    speakingBand: numField(item, "speakingBand"),
    finishedAt: strField(item, "submittedAt", "gradedAt", "createdAt"),
    startedAt: strField(item, "startedAt"),
    examType: strField(item, "examType") ?? strField(item, "level"),
    level: strField(item, "level"),
    timeSpentSeconds: numField(item, "timeSpentSeconds"),
  }));
}

interface ScoreTrendRaw {
  date?: string;
  avgScore?: number;
  testCount?: number;
  skill?: string;
}

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function parseTrend(res: unknown): TrendSeries[] {
  if (!res) return [];
  const outer = asObj(res);
  if (!outer) return [];
  const innerData = asObj(outer.data)?.data;
  const d = (innerData ?? outer.data) as unknown;
  if (!d) return [];

  // Shape A: array of points, optionally with `skill` per point.
  const candidateArrays: ScoreTrendRaw[][] = [];
  if (Array.isArray(d)) candidateArrays.push(d as unknown as ScoreTrendRaw[]);
  const dObj = asObj(d);
  if (dObj) {
    for (const k of ["points", "data", "trend"]) {
      if (Array.isArray(dObj[k])) {
        candidateArrays.push(dObj[k] as unknown as ScoreTrendRaw[]);
      }
    }
  }

  // Shape B: per-skill series: `{ reading: [...], listening: [...], ... }`.
  const perSkill: Partial<Record<SkillKey, ScoreTrendRaw[]>> = {};
  if (dObj && (dObj["reading"] || dObj["listening"] || dObj["writing"] || dObj["speaking"])) {
    (["reading", "listening", "writing", "speaking"] as SkillKey[]).forEach((k) => {
      if (Array.isArray(dObj[k])) {
        perSkill[k] = dObj[k] as unknown as ScoreTrendRaw[];
      }
    });
  }

  const out: TrendSeries[] = [];
  const seen = new Set<string>();

  for (const list of candidateArrays) {
    const grouped: Partial<Record<SkillKey, ScoreTrendRaw[]>> = {};
    for (const pt of list) {
      const skill = (normaliseSkill(pt.skill) ?? "reading") as SkillKey;
      grouped[skill] = grouped[skill] ?? [];
      grouped[skill]!.push(pt);
    }
    for (const [k, pts] of Object.entries(grouped)) {
      if (!pts) continue;
      const key = `${k}-${pts.length}-${pts[0]?.date ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        skill: k as SkillKey,
        points: pts
          .filter((p) => p.date != null && typeof p.avgScore === "number")
          .map((p) => ({ date: String(p.date), avgScore: Number(p.avgScore) })),
      });
    }
  }

  for (const [k, pts] of Object.entries(perSkill)) {
    if (!pts) continue;
    out.push({
      skill: k as SkillKey,
      points: pts
        .filter((p) => p.date != null && typeof p.avgScore === "number")
        .map((p) => ({ date: String(p.date), avgScore: Number(p.avgScore) })),
    });
  }

  // Dedup series by skill — keep the longest one.
  const bySkill = new Map<SkillKey, TrendSeries>();
  for (const s of out) {
    const existing = bySkill.get(s.skill);
    if (!existing || existing.points.length < s.points.length) {
      bySkill.set(s.skill, s);
    }
  }
  return Array.from(bySkill.values()).sort((a, b) =>
    a.skill.localeCompare(b.skill)
  );
}

function parseSummary(
  res: unknown
): { totalAttempts: number | null; avgScore: number | null } {
  const outer = asObj(res);
  if (!outer) return { totalAttempts: null, avgScore: null };
  const innerData = asObj(outer.data)?.data;
  const d = (innerData ?? outer.data) as unknown;
  if (!d) return { totalAttempts: null, avgScore: null };
  const obj = asObj(d);
  if (!obj) return { totalAttempts: null, avgScore: null };
  return {
    totalAttempts: numField(obj, "totalAttempts", "total"),
    avgScore: numField(obj, "avgScore", "averageBand"),
  };
}

function parsePredicted(res: unknown): number | null {
  const outer = asObj(res);
  if (!outer) return null;
  const d = outer.data;
  if (d == null) return null;
  const top = asObj(d);
  if (!top) return null;
  // Backend returns { isSuccess, data: { overallBand, ... } } per PredictedBandWidget.
  if (top["isSuccess"] === true && top["data"]) {
    const inner = asObj(top["data"]);
    if (inner) {
      const band = numField(inner, "overallBand", "predictedBand");
      if (band != null) return band;
    }
  }
  const band = numField(top, "overallBand", "predictedBand");
  return band;
}
