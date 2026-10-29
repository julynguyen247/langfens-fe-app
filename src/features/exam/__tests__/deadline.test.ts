import { describe, expect, it } from "vitest";
import { getAttemptDeadline } from "../deadline";

describe("attempt deadline", () => {
  const start = "2026-01-01T00:00:00Z";
  const startMs = Date.parse(start);
  it("does not extend time on remount using a cached timeLeft", () => {
    expect(getAttemptDeadline(start, 3600, 3600, startMs + 1800_000)).toBe(startMs + 3600_000);
  });
  it("preserves an expired absolute deadline", () => {
    expect(getAttemptDeadline(start, 60, 60, startMs + 120_000)).toBe(startMs + 60_000);
  });
  it("falls back to an available server timeLeft when the timestamp is invalid", () => {
    expect(getAttemptDeadline("invalid", 60, 30, startMs)).toBe(startMs + 30_000);
  });
  it("accepts zero remaining time rather than inventing a fresh duration", () => {
    expect(getAttemptDeadline(undefined, 3600, 0, startMs)).toBe(startMs);
  });
  it("does not submit or fabricate a deadline with missing or malformed timing data", () => {
    expect(getAttemptDeadline(undefined, undefined, undefined, startMs)).toBeNull();
    expect(getAttemptDeadline("invalid", NaN, NaN, startMs)).toBeNull();
  });
});
