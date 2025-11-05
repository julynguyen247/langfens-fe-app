import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";

export type StudyCard = {
  id: string;
  front: string;
  back: string;
  example?: string;
};

export type Grade = "again" | "hard" | "good" | "easy";

export type SRStats = {
  /** Số thẻ mới trong phiên (ước lượng đơn giản) */
  new: number;
  /** Số thẻ đang “học lại” trong phiên */
  learning: number;
  /** Số thẻ đã hoàn tất trong phiên */
  review: number;
  /** Số thẻ còn lại cần làm trong phiên (due in session) */
  dueToday: number;
};

type Options = {
  /** Callback (không blocking) khi chấm độ khó — dùng để gọi BE */
  onGrade?: (card: StudyCard, grade: Grade) => void | Promise<void>;
  /** Số bước “đẩy lùi” cho grade=hard (mặc định 3) */
  hardOffset?: number;
};

export default function useDeckStudy(items: StudyCard[], opts: Options = {}) {
  const { onGrade, hardOffset = 3 } = opts;

  // ===== Core states =====
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<number[]>([]); // queue theo index của items gốc
  const total = items.length;

  // Session stats (đơn giản, phục vụ UI)
  const [stats, setStats] = useState<SRStats>({
    new: 0,
    learning: 0,
    review: 0,
    dueToday: 0,
  });

  // Lưu tổng ban đầu để ước lượng "new" trong phiên
  const [initialTotal, setInitialTotal] = useState(0);
  const router = useRouter();

  // ===== Re-init khi items thay đổi =====
  useEffect(() => {
    if (!total) {
      setIndex(0);
      setOrder([]);
      setFlipped(false);
      setStats({ new: 0, learning: 0, review: 0, dueToday: 0 });
      setInitialTotal(0);
      return;
    }
    const base = Array.from({ length: total }, (_, i) => i);
    setOrder(base);
    setIndex(0);
    setFlipped(false);
    setInitialTotal(total);
    setStats({
      new: total, // ước lượng: tất cả là “new” lúc vào phiên
      learning: 0,
      review: 0,
      dueToday: total,
    });
  }, [total]);

  // ===== Card hiện tại (theo order) =====
  const card = useMemo(() => {
    if (!order.length) return undefined;
    const realIdx = order[index];
    return items[realIdx];
  }, [items, order, index]);

  // ===== Helpers =====
  const clampIndex = (arrLen: number, prefer: number) =>
    Math.max(0, Math.min(prefer, Math.max(arrLen - 1, 0)));

  const setDue = (len: number) => setStats((s) => ({ ...s, dueToday: len }));

  const bumpLearning = () =>
    setStats((s) => ({
      ...s,
      learning: s.learning + 1,
      new: Math.max(0, s.new - 1),
    }));

  const bumpReview = () =>
    setStats((s) => ({
      ...s,
      review: s.review + 1,
      new: Math.max(0, s.new - 1),
    }));

  // ===== Actions =====
  const flip = useCallback(() => setFlipped((v) => !v), []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1 < (order.length || 0) ? i + 1 : i));
    setFlipped(false);
  }, [order.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 >= 0 ? i - 1 : i));
    setFlipped(false);
  }, []);

  /** SR: di chuyển lại phần tử hiện tại theo độ khó */
  const grade = useCallback(
    (g: Grade) => {
      if (!order.length) return;

      setOrder((o) => {
        const curPos = index;
        const cur = o[curPos];
        const rest = o.filter((_, i) => i !== curPos);

        let newOrder = rest;
        let newIndex = curPos; // sau thao tác, index sẽ trỏ tới thẻ kế tiếp (vị trí curPos trong mảng mới)

        switch (g) {
          case "again": {
            // Đẩy về CUỐI queue → sẽ gặp lại cuối phiên
            newOrder = [...rest, cur];
            bumpLearning();
            break;
          }
          case "hard": {
            // Đẩy “lùi” vài vị trí (mặc định 3) để sớm gặp lại
            const insertPos = Math.min(rest.length, curPos + hardOffset);
            newOrder = [
              ...rest.slice(0, insertPos),
              cur,
              ...rest.slice(insertPos),
            ];
            bumpLearning();
            break;
          }
          case "good":
          case "easy": {
            // Hoàn tất: bỏ khỏi queue của phiên
            newOrder = rest;
            newIndex = curPos; // trỏ tới phần tử mới đang ở vị trí curPos
            bumpReview();
            break;
          }
        }

        // Cập nhật index & flipped
        const nextIdx = clampIndex(newOrder.length, newIndex);
        setIndex(nextIdx);
        setFlipped(false);

        // Cập nhật dueToday
        setDue(newOrder.length);

        // Callback ra ngoài (không blocking)
        if (card && onGrade) {
          try {
            Promise.resolve(onGrade(card, g)).catch(() => {});
          } catch {}
        }

        return newOrder;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order.length, index, card, onGrade, hardOffset]
  );

  /** Back-compat: map lại về grade */
  const again = useCallback(() => grade("again"), [grade]);
  const know = useCallback(() => grade("good"), [grade]);

  const shuffle = useMemo(
    () => order.length > 0 && !order.every((v, i) => v === i),
    [order]
  );

  const toggleShuffle = useCallback(() => {
    setOrder((o) => {
      if (!o.length) return o;
      const isShuffled = !o.every((v, i) => v === i);
      if (isShuffled) {
        // trở lại thứ tự gốc (dựa vào items hiện tại)
        const next = Array.from({ length: o.length }, (_, i) => i);
        setIndex(0);
        setFlipped(false);
        setDue(next.length);
        return next;
      }
      // trộn Fisher–Yates
      const arr = Array.from({ length: o.length }, (_, i) => i);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setIndex(0);
      setFlipped(false);
      setDue(arr.length);
      return arr;
    });
  }, []);

  const handleExit = useCallback(() => {
    router.back();
  }, []);

  return {
    card,
    index,
    total: order.length || total, // phản ánh danh sách hiện hành
    flipped,
    flip,
    prev,
    next,
    again,
    know,
    grade,
    stats,
    shuffle,
    toggleShuffle,
    handleExit,
  };
}
