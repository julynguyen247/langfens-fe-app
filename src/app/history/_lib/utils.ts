// Shared utilities for the History page.
// CEFR + band descriptor mappings, date formatting, skill styling.

export type SkillKey = "reading" | "listening" | "writing" | "speaking";

export const SKILL_LABEL: Record<SkillKey, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

// Maps a normalised skill string back to its long form so we can read
// `item.skill === "LISTENING"` etc.
export function normaliseSkill(raw: string | undefined | null): SkillKey | null {
  if (!raw) return null;
  const s = String(raw).toUpperCase().trim();
  if (s.startsWith("READ")) return "reading";
  if (s.startsWith("LIST")) return "listening";
  if (s.startsWith("WRIT")) return "writing";
  if (s.startsWith("SPEAK")) return "speaking";
  return null;
}

// CEFR mapping (IELTS → CEFR) — accepts numeric band rounded to 0.5.
export function cefrForBand(band: number | null | undefined): string {
  if (band == null || Number.isNaN(band)) return "—";
  const b = Math.round(band * 2) / 2;
  if (b >= 8.5) return "C2";
  if (b >= 7.0) return "C1";
  if (b >= 5.5) return "B2";
  if (b >= 4.0) return "B1";
  return "A2";
}

// British Council style band descriptor.
export function bandDescriptor(band: number | null | undefined): string {
  if (band == null || Number.isNaN(band)) return "Pending";
  const b = Math.round(band * 2) / 2;
  if (b >= 9.0) return "Expert user";
  if (b >= 8.0) return "Very good user";
  if (b >= 7.0) return "Good user";
  if (b >= 6.0) return "Competent user";
  if (b >= 5.0) return "Modest user";
  if (b >= 4.0) return "Limited user";
  if (b >= 3.0) return "Extremely limited user";
  if (b >= 2.0) return "Intermittent user";
  if (b >= 1.0) return "Non-user";
  return "Did not attempt";
}

// Full-band IELTS long label, used in legends / hover tooltips.
export function bandTitle(band: number | null | undefined): string {
  if (band == null || Number.isNaN(band)) return "Not graded";
  const b = Math.round(band * 2) / 2;
  return `Band ${b.toFixed(1)} — ${bandDescriptor(b)}`;
}

// Render a band number as a UI string. `null/NaN` → "—".
export function formatBand(band: number | null | undefined): string {
  if (band == null || Number.isNaN(band)) return "—";
  const b = Math.round(band * 2) / 2;
  // Drop trailing .0
  return Number.isInteger(b) ? b.toFixed(1) : b.toFixed(1);
}

// IELTS date format: "14 March 2026"
export function formatAttemptDate(input: string | undefined | null): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// Relative time. Returns "today", "yesterday", "N days ago", "N weeks ago",
// "N months ago", or "in N days" for future dates (defensive only).
export function relativeTime(input: string | undefined | null): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const absMs = Math.abs(diffMs);
  const day = 24 * 60 * 60 * 1000;
  const days = Math.round(absMs / day);
  if (days <= 0) return "today";
  if (days === 1) return diffMs > 0 ? "in 1 day" : "yesterday";
  if (days < 7) return diffMs > 0 ? `in ${days} days` : `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return diffMs > 0 ? `in ${weeks} weeks` : `${weeks} weeks ago`;
  const months = Math.round(days / 30);
  if (months < 12) return diffMs > 0 ? `in ${months} months` : `${months} months ago`;
  const years = Math.round(days / 365);
  return diffMs > 0 ? `in ${years} years` : `${years} years ago`;
}

// Format seconds as "12m 04s". Defensive on undefined/NaN.
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return "";
  const s = Math.max(0, Math.round(seconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
}

// Extract a numeric exam-type label from various backend shapes.
export function examTypeLabel(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "number") {
    return input === 1 ? "General Training" : "Academic";
  }
  const s = String(input).toLowerCase();
  if (!s) return "";
  if (s.includes("general")) return "General Training";
  if (s.includes("academic")) return "Academic";
  if (s.includes("gt")) return "General Training";
  if (s.includes("ac")) return "Academic";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normaliseStatus(raw: string | undefined | null): {
  key: "graded" | "submitted" | "in_progress" | "expired" | "unknown";
  label: string;
} {
  if (!raw) return { key: "unknown", label: "Unknown" };
  const s = String(raw).toUpperCase().trim();
  if (s === "GRADED" || s === "COMPLETED") return { key: "graded", label: "Graded" };
  if (s === "SUBMITTED" || s === "PENDING") return { key: "submitted", label: "Submitted" };
  if (s === "IN_PROGRESS" || s === "STARTED" || s === "DOING") {
    return { key: "in_progress", label: "In progress" };
  }
  if (s === "EXPIRED") return { key: "expired", label: "Expired" };
  return { key: "unknown", label: raw };
}

// Read an attempt row and return the best-known band, regardless of which
// skill it covers.
export function effectiveBand(item: AttemptRecord): number | null {
  const candidates = [item.bandScore, item.overallBand, item.writingBand, item.speakingBand];
  for (const v of candidates) {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return null;
}

// Generate a smooth bezier path through the supplied points (cubic). Used by
// the line chart in `ScoreTrendChart.tsx`. Caller controls coordinates.
export function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const parts: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const tension = 0.18;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    parts.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return parts.join(" ");
}

// Compact shape used throughout the redesigned page.
export interface AttemptRecord {
  id: string;
  skill: SkillKey;
  examTitle: string;
  status: string;
  bandScore?: number | null;
  overallBand?: number | null;
  writingBand?: number | null;
  speakingBand?: number | null;
  correctCount?: number | null;
  totalQuestions?: number | null;
  finishedAt?: string | null;
  startedAt?: string | null;
  examType?: string | number | null;
  level?: string | null;
  timeSpentSeconds?: number | null;
}
