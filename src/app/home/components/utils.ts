export function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
export function diffMinutesSafe(start?: string, end?: string): number {
  try {
    const s = start ? new Date(start).getTime() : NaN;
    const e = end ? new Date(end).getTime() : NaN;
    if (!isFinite(s) || !isFinite(e)) return 1;
    const diffMs = Math.max(0, e - s);
    return Math.max(1, Math.round(diffMs / 60000));
  } catch {
    return 1;
  }
}

export function cryptoRandom() {
  return Math.random().toString(36).slice(2, 10);
}
