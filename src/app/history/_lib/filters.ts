import { type TimeRangeKey } from "../_components/FilterBar";
import { effectiveBand, type AttemptRecord } from "./utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function ts(item: AttemptRecord): number {
  if (!item.finishedAt) return 0;
  const t = new Date(item.finishedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function bandValue(item: AttemptRecord): number {
  return effectiveBand(item) ?? -1;
}

export function timeRangeCutoff(range: TimeRangeKey): number | null {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (range === "7d") return now - 7 * day;
  if (range === "30d") return now - 30 * day;
  if (range === "90d") return now - 90 * day;
  return null;
}

export function bandDescriptorShort(band: number): string {
  const b = Math.round(band * 2) / 2;
  if (b >= 7.0) return "On track";
  if (b >= 5.5) return "Building";
  if (b >= 4.0) return "Growing";
  return "Just starting";
}

export function isAcademic(tag: unknown): boolean {
  if (tag == null) return false;
  const s = String(tag).toLowerCase();
  if (s.includes("academic") || s === "ac") return true;
  if (typeof tag === "number" && tag === 0) return true;
  return false;
}

export function isGeneral(tag: unknown): boolean {
  if (tag == null) return false;
  const s = String(tag).toLowerCase();
  if (s.includes("general") || s === "gt") return true;
  if (typeof tag === "number" && tag === 1) return true;
  return false;
}
