// Shared utilities for the Analytics page.
//
// We re-export the helpers from `../history/_lib/utils` (pure functions) rather
// than duplicating them, so history stays untouched. Analytics-specific helpers
// (percent → band conversion, accuracy tiers, etc.) live here.
//
// ---------------------------------------------------------------------------
// BACKEND CONTRACT — `getAnalyticsSummary` field semantics
// ---------------------------------------------------------------------------
// The same endpoint returns different shapes depending on the consumer:
//   - `summary.avgScore`           — percent 0–100 (matches home page Math.round + % suffix,
//                                    matches existing analytics `toFixed(1)%` and `> 50` threshold)
//   - `summary.skillScores.*`      — IELTS band 0–9  (home `SkillProgressCard` renders `toFixed(1)`
//                                    straight onto a 0–9 ring)
//   - `getScoreTrend(days)[i].avgScore` — percent 0–100 (same as `summary.avgScore`)
// We treat `avgScore` as percent everywhere and convert to band via
// `percentToBand()` only for display. The chart can render either scale by
// passing `yMin`/`yMax`/`yLabel`/`formatHoverValue` props to `ScoreTrendChart`.

import {
  normaliseSkill,
  type SkillKey,
} from "../../history/_lib/utils";

export {
  SKILL_LABEL,
  cefrForBand,
  bandDescriptor,
  bandTitle,
  formatBand,
  formatAttemptDate,
  relativeTime,
  formatDuration,
  examTypeLabel,
  normaliseStatus,
  effectiveBand,
  smoothPath,
  type AttemptRecord,
  type SkillKey as SkillKeyType,
} from "../../history/_lib/utils";

// ---------------------------------------------------------------------------
// Analytics-specific helpers
// ---------------------------------------------------------------------------

/**
 * Convert a percentage (0–100) to an IELTS band 0–9.
 * Used for KPI labels — the trend chart itself can plot either scale.
 */
export function percentToBand(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.round(((pct / 100) * 9) * 2) / 2;
}

/**
 * Map an accuracy value to one of three colour tiers.
 *   - "high" ≥ 70%   → green / skill-speaking
 *   - "mid"  ≥ 40%   → amber / accent-gold
 *   - "low"  < 40%   → red   / destructive
 */
export function getAccuracyTier(accuracy: number): "high" | "mid" | "low" {
  if (accuracy >= 70) return "high";
  if (accuracy >= 40) return "mid";
  return "low";
}

/** "12h 30m" / "45m" — matches the legacy analytics format. */
export function formatStudyTime(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return "0m";
  const total = Math.round(min);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
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
  SENTENCE_COMPLETION: "Sentence",
  FLOW_CHART: "Flow Chart",
};

/** Map raw question-type enums (READING/LISTENING) to human labels. */
export function formatQuestionType(type: string): string {
  const known = QUESTION_TYPE_LABEL[type];
  if (known) return known;
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

/** "14 Mar" style short date — ported from the legacy analytics page. */
export function formatShortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
}

/** Coerce any value into a finite number, falling back if invalid. */
export function safeNumber(x: unknown, fallback = 0): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function nullableNumber(x: unknown): number | null {
  const n = safeNumber(x, NaN);
  return Number.isFinite(n) ? n : null;
}

function safeString(x: unknown, fallback = ""): string {
  if (typeof x === "string" && x.length > 0) return x;
  if (typeof x === "number" && Number.isFinite(x)) return String(x);
  return fallback;
}

// ---------------------------------------------------------------------------
// Defensive response parsers — match the analytics endpoint contract.
// ---------------------------------------------------------------------------

/** Drill into a `{ data: { data: ... } }` or `{ data: ... }` axios envelope. */
function pickData(res: unknown): Record<string, unknown> | null {
  if (!res || typeof res !== "object") return null;
  const outer = res as Record<string, unknown>;
  const innerData = (outer.data as { data?: unknown } | undefined)?.data;
  const d = (innerData ?? outer.data) as unknown;
  if (!d || typeof d !== "object") return null;
  return d as Record<string, unknown>;
}

export interface AnalyticsSummary {
  totalAttempts: number | null;
  totalStudyTimeMin: number | null;
  /** Percent 0–100 — see CONTRACT comment at the top of this file. */
  avgScore: number | null;
  currentStreak: number | null;
  testsBySkill: Record<string, number> | null;
  /** Per-skill band scores 0–9 (different scale from `avgScore`). */
  skillScores?: Record<string, number> | null;
}

function recordOfNumbers(input: unknown): Record<string, number> | null {
  if (!input || typeof input !== "object") return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const n = safeNumber(v, NaN);
    if (Number.isFinite(n)) out[k] = n;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function parseSummary(res: unknown): AnalyticsSummary {
  const d = pickData(res);
  if (!d) {
    return {
      totalAttempts: null,
      totalStudyTimeMin: null,
      avgScore: null,
      currentStreak: null,
      testsBySkill: null,
      skillScores: null,
    };
  }
  const totalAttempts = safeNumber(d["totalAttempts"], NaN);
  const totalStudyTimeMin = safeNumber(d["totalStudyTimeMin"], NaN);
  const avgScore = safeNumber(d["avgScore"], NaN);
  const currentStreak = safeNumber(d["currentStreak"], NaN);
  return {
    totalAttempts: Number.isFinite(totalAttempts) ? totalAttempts : null,
    totalStudyTimeMin: Number.isFinite(totalStudyTimeMin) ? totalStudyTimeMin : null,
    avgScore: Number.isFinite(avgScore) ? avgScore : null,
    currentStreak: Number.isFinite(currentStreak) ? currentStreak : null,
    testsBySkill: recordOfNumbers(d["testsBySkill"]),
    skillScores: recordOfNumbers(d["skillScores"]),
  };
}

export interface ScoreTrendPoint {
  date: string;
  /** Percent 0–100 — see CONTRACT comment. */
  avgScore: number;
  testCount: number;
  skill?: string;
}

export interface TrendSeries {
  skill: SkillKey;
  points: Array<{ date: string; avgScore: number }>;
}

/** Shape A: flat array of points. Shape B: per-skill series. */
export function parseTrend(res: unknown): TrendSeries[] {
  if (!res || typeof res !== "object") return [];
  const outer = res as Record<string, unknown>;
  const innerData = (outer.data as { data?: unknown } | undefined)?.data;
  const d = (innerData ?? outer.data) as unknown;
  if (!d) return [];

  const candidateArrays: ScoreTrendPoint[][] = [];
  if (Array.isArray(d)) {
    candidateArrays.push(d as unknown as ScoreTrendPoint[]);
  }
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;
    for (const k of ["points", "data", "trend"]) {
      if (Array.isArray(obj[k])) {
        candidateArrays.push(obj[k] as unknown as ScoreTrendPoint[]);
      }
    }
  }

  const perSkill: Partial<Record<SkillKey, ScoreTrendPoint[]>> = {};
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;
    if (
      obj["reading"] ||
      obj["listening"] ||
      obj["writing"] ||
      obj["speaking"]
    ) {
      (["reading", "listening", "writing", "speaking"] as SkillKey[]).forEach(
        (k) => {
          if (Array.isArray(obj[k])) {
            perSkill[k] = obj[k] as unknown as ScoreTrendPoint[];
          }
        },
      );
    }
  }

  const out: TrendSeries[] = [];
  const seen = new Set<string>();

  for (const list of candidateArrays) {
    const grouped: Partial<Record<SkillKey, ScoreTrendPoint[]>> = {};
    for (const pt of list) {
      const skill = normaliseSkill(pt.skill) ?? "reading";
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
          .filter(
            (p) =>
              p.date != null &&
              typeof p.avgScore === "number" &&
              Number.isFinite(p.avgScore),
          )
          .map((p) => ({ date: String(p.date), avgScore: Number(p.avgScore) })),
      });
    }
  }

  for (const [k, pts] of Object.entries(perSkill)) {
    if (!pts) continue;
    out.push({
      skill: k as SkillKey,
      points: pts
        .filter(
          (p) =>
            p.date != null &&
            typeof p.avgScore === "number" &&
            Number.isFinite(p.avgScore),
        )
        .map((p) => ({ date: String(p.date), avgScore: Number(p.avgScore) })),
    });
  }

  // De-dup by skill, keep longest.
  const bySkill = new Map<SkillKey, TrendSeries>();
  for (const s of out) {
    const existing = bySkill.get(s.skill);
    if (!existing || existing.points.length < s.points.length) {
      bySkill.set(s.skill, s);
    }
  }
  return Array.from(bySkill.values()).sort((a, b) =>
    a.skill.localeCompare(b.skill),
  );
}

export interface PredictedBandData {
  overallBand: number;
  confidence: string;
  readingBand: number | null;
  listeningBand: number | null;
  writingBand: number | null;
  speakingBand: number | null;
  sampleSize: number | null;
  latestAttemptDate: string | null;
}

function buildPredicted(obj: Record<string, unknown>): PredictedBandData | null {
  const overall = safeNumber(obj["overallBand"], NaN);
  if (!Number.isFinite(overall)) return null;
  return {
    overallBand: overall,
    confidence: safeString(obj["confidence"], ""),
    readingBand: nullableNumber(obj["readingBand"]),
    listeningBand: nullableNumber(obj["listeningBand"]),
    writingBand: nullableNumber(obj["writingBand"]),
    speakingBand: nullableNumber(obj["speakingBand"]),
    sampleSize: nullableNumber(obj["sampleSize"]),
    latestAttemptDate: safeString(obj["latestAttemptDate"], "") || null,
  };
}

export function parsePredicted(res: unknown): PredictedBandData | null {
  if (!res || typeof res !== "object") return null;
  const outer = res as Record<string, unknown>;
  const d = outer.data;
  if (!d || typeof d !== "object") return null;
  const top = d as Record<string, unknown>;

  // Shape A: { isSuccess, data: { overallBand, ... } }
  if (top["isSuccess"] === true && top["data"] && typeof top["data"] === "object") {
    const parsed = buildPredicted(top["data"] as Record<string, unknown>);
    if (parsed) return parsed;
  }
  // Shape B: top-level overallBand.
  return buildPredicted(top);
}

export interface QuestionTypeAccuracy {
  type: string;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface StrengthsWeaknesses {
  strengths: QuestionTypeAccuracy[];
  weaknesses: QuestionTypeAccuracy[];
}

export function parseStrengths(res: unknown): StrengthsWeaknesses {
  const d = pickData(res);
  if (!d) return { strengths: [], weaknesses: [] };
  return {
    strengths: normaliseQuestionTypes(d["strengths"]),
    weaknesses: normaliseQuestionTypes(d["weaknesses"]),
  };
}

function normaliseQuestionTypes(input: unknown): QuestionTypeAccuracy[] {
  if (!Array.isArray(input)) return [];
  const out: QuestionTypeAccuracy[] = [];
  for (const it of input) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const type = safeString(o["type"], "");
    if (!type) continue;
    out.push({
      type,
      accuracy: safeNumber(o["accuracy"], 0),
      totalQuestions: safeNumber(o["totalQuestions"], 0),
      correctAnswers: safeNumber(o["correctAnswers"], 0),
    });
  }
  return out;
}

export interface WrongAnswer {
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
}

export function parseWrongAnswers(
  res: unknown,
): { items: WrongAnswer[]; total: number } {
  if (!res || typeof res !== "object") return { items: [], total: 0 };
  const outer = res as Record<string, unknown>;
  const data = outer.data;
  if (!data || typeof data !== "object") return { items: [], total: 0 };
  const inner =
    (data as Record<string, unknown>)["data"] ?? data;
  if (!inner || typeof inner !== "object") return { items: [], total: 0 };
  const obj = inner as Record<string, unknown>;
  const rawItems = obj["items"];
  const items: WrongAnswer[] = [];
  if (Array.isArray(rawItems)) {
    for (const it of rawItems as unknown[]) {
      if (!it || typeof it !== "object") continue;
      const o = it as Record<string, unknown>;
      const answerId = safeString(o["answerId"], "");
      if (!answerId) continue;
      items.push({
        answerId,
        questionId: safeString(o["questionId"], ""),
        questionContent: safeString(o["questionContent"], ""),
        questionType: safeString(o["questionType"], ""),
        skill: safeString(o["skill"], ""),
        userAnswer: safeString(o["userAnswer"], ""),
        correctAnswer: safeString(o["correctAnswer"], ""),
        explanation: safeString(o["explanation"], "") || undefined,
        attemptDate: safeString(o["attemptDate"], ""),
        examId: safeString(o["examId"], ""),
        attemptId: safeString(o["attemptId"], ""),
      });
    }
  }
  return { items, total: safeNumber(obj["total"], items.length) };
}

export interface Recommendation {
  examId: string;
  title: string;
  category: string;
  reasons: string[];
  relevanceScore: number;
  questionCount: number;
}

export function parseRecommendations(res: unknown): Recommendation[] {
  if (!res || typeof res !== "object") return [];
  const outer = res as Record<string, unknown>;
  const data = outer.data;
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  let list: unknown = null;
  if (Array.isArray(obj["recommendations"])) {
    list = obj["recommendations"];
  } else if (Array.isArray(data)) {
    list = data;
  } else if (
    obj["data"] &&
    typeof obj["data"] === "object" &&
    Array.isArray((obj["data"] as Record<string, unknown>)["recommendations"])
  ) {
    list = (obj["data"] as Record<string, unknown>)["recommendations"];
  }
  if (!Array.isArray(list)) return [];
  const out: Recommendation[] = [];
  for (const it of list as unknown[]) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const examId = safeString(o["examId"], "");
    if (!examId) continue;
    const reasons: string[] = [];
    if (Array.isArray(o["reasons"])) {
      for (const r of o["reasons"] as unknown[]) {
        if (typeof r === "string") reasons.push(r);
      }
    }
    out.push({
      examId,
      title: safeString(o["title"], ""),
      category: safeString(o["category"], ""),
      reasons,
      relevanceScore: safeNumber(o["relevanceScore"], 0),
      questionCount: safeNumber(o["questionCount"], 0),
    });
  }
  return out;
}

export interface AiInsight {
  type: "success" | "warning" | "danger" | "info";
  message: string;
}

export function parseAiInsights(res: unknown): AiInsight[] {
  if (!res || typeof res !== "object") return [];
  const outer = res as Record<string, unknown>;
  const data = outer.data;
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  let list: unknown = null;
  if (Array.isArray(obj["insights"])) {
    list = obj["insights"];
  } else if (Array.isArray(data)) {
    list = data;
  }
  if (!Array.isArray(list)) return [];
  const out: AiInsight[] = [];
  for (const it of list as unknown[]) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const message = safeString(o["message"], "");
    if (!message) continue;
    const rawType = safeString(o["type"], "info").toLowerCase();
    const type: AiInsight["type"] =
      rawType === "success" ||
      rawType === "warning" ||
      rawType === "danger"
        ? (rawType as AiInsight["type"])
        : "info";
    out.push({ type, message });
  }
  return out;
}

export interface GamificationStats {
  currentStreak: number | null;
}

export function parseGamification(res: unknown): GamificationStats {
  if (!res || typeof res !== "object") return { currentStreak: null };
  const outer = res as Record<string, unknown>;
  const data = outer.data;
  if (!data || typeof data !== "object") return { currentStreak: null };
  const obj = data as Record<string, unknown>;
  const inner =
    obj["data"] && typeof obj["data"] === "object"
      ? (obj["data"] as Record<string, unknown>)
      : obj;
  const streak = safeNumber(inner["currentStreak"], NaN);
  return {
    currentStreak: Number.isFinite(streak) ? streak : null,
  };
}

export interface ActivityDay {
  date: string;
  count: number;
}

export function parseActivity(res: unknown): ActivityDay[] {
  if (!res || typeof res !== "object") return [];
  const outer = res as Record<string, unknown>;
  const data = outer.data;
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  let list: unknown = null;
  if (Array.isArray(obj["days"])) {
    list = obj["days"];
  } else if (Array.isArray(obj["activity"])) {
    list = obj["activity"];
  } else if (Array.isArray(data)) {
    list = data;
  }
  if (!Array.isArray(list)) return [];
  const out: ActivityDay[] = [];
  for (const it of list as unknown[]) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const date = safeString(o["date"], "");
    if (!date) continue;
    out.push({ date, count: safeNumber(o["count"], 0) });
  }
  return out;
}
