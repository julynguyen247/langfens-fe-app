export function pickArray<T = unknown>(res: any): T[] {
  const payload = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(payload)) return payload as T[];
  return [payload as T];
}

// ====================================
// MASTERY RING COLOR HELPER
// ====================================
export function getMasteryColor(mastery: number): string {
  if (mastery < 30) return "var(--destructive)";
  if (mastery <= 70) return "var(--accent-gold)";
  return "var(--skill-speaking)";
}
