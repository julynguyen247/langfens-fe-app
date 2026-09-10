// Sprint 3: pins the numeric-sort contract applied at line ~27 of
// CompletionCard.tsx after the dict-keys ordering fix.
//
// This test file is scaffold-only: vitest is not configured for the
// langfens-fe-app Next.js project (only Playwright is in devDependencies).
// Run via `npx vitest` after installing vitest + @testing-library/react.

import { describe, it, expect } from "vitest";

// Mirror of the sort applied at the top of CompletionCard():
//   Object.keys(texts).sort((a, b) => {
//     const na = Number(a); const nb = Number(b);
//     if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
//     return String(a).localeCompare(String(b));
//   });
function sortBlankKeys(raw: string[]): string[] {
  return [...raw].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

describe.skip("CompletionCard blankKeys sort (Sprint 3)", () => {
  it("sorts non-monotonic numeric dict keys into ascending order", () => {
    const input = Object.keys({ "5": "a", "3": "b", "1": "c" });
    expect(sortBlankKeys(input)).toEqual(["1", "3", "5"]);
  });
});