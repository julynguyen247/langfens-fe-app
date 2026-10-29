/** A cached timeLeft is relative to an earlier response; never let it extend a valid deadline. */
export function getAttemptDeadline(
  startedAt: string | null | undefined,
  durationSec: number | null | undefined,
  timeLeft: number | null | undefined,
  now = Date.now()
): number | null {
  const start = startedAt ? new Date(startedAt).getTime() : NaN;
  if (Number.isFinite(start) && typeof durationSec === "number" && Number.isFinite(durationSec) && durationSec > 0) {
    return start + durationSec * 1000;
  }
  if (typeof timeLeft === "number" && Number.isFinite(timeLeft) && timeLeft >= 0) return now + timeLeft * 1000;
  return null;
}
