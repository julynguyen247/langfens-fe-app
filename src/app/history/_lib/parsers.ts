import { type TrendSeries } from "../_components/ScoreTrendChart";
import { normaliseSkill, type AttemptRecord, type SkillKey } from "./utils";

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

export function parseReading(res: unknown): AttemptRecord[] {
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

export function parseWriting(res: unknown): AttemptRecord[] {
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

export function parseSpeaking(res: unknown): AttemptRecord[] {
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

export function parseTrend(res: unknown): TrendSeries[] {
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

export function parseSummary(
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

export function parsePredicted(res: unknown): number | null {
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
