// ====================================
// TYPES
// ====================================
import type { Attempt } from "./types";

// ====================================
// HELPER FUNCTIONS
// ====================================
export function buildAttemptUrl(a: Attempt) {
  if (a.skill === "Writing") return `/attempts/${a.id}?source=writing`;
  if (a.skill === "Speaking") return `/attempts/${a.id}?source=speaking`;
  return `/attempts/${a.id}?source=attempt`;
}
