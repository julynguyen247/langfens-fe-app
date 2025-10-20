import { useCallback, useEffect, useMemo, useState } from "react";

type Card = { id: string; front: string; back: string; example?: string };
export default function useDeckStudy(cards: Card[]) {
  const [order, setOrder] = useState(cards.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const total = order.length;
  const card = useMemo(() => cards[order[index]], [cards, order, index]);

  const flip = useCallback(() => setFlipped((s) => !s), []);
  const next = useCallback(() => {
    setIndex((i) => (i + 1) % total);
    setFlipped(false);
  }, [total]);
  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
    setFlipped(false);
  }, [total]);

  const randomize = (arr: number[]) =>
    arr.slice().sort(() => Math.random() - 0.5);
  const toggleShuffle = useCallback(() => {
    setShuffle((s) => !s);
    setOrder((o) => (shuffle ? cards.map((_, i) => i) : randomize(o)));
    setIndex(0);
    setFlipped(false);
  }, [shuffle, cards]);

  const again = useCallback(() => {
    // gửi thẻ hiện tại về cuối hàng đợi
    setOrder((o) => {
      const cur = o[index];
      const rest = o.filter((_, i) => i !== index);
      return [...rest, cur];
    });
    setFlipped(false);
  }, [index]);

  const know = useCallback(() => {
    // loại thẻ khỏi vòng lặp
    setOrder((o) => o.filter((_, i) => i !== index));
    setIndex((i) => Math.min(i, total - 2));
    setFlipped(false);
  }, [index, total]);

  const handleExit = useCallback(() => {
    history.back();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        flip();
      } else if (e.key === "1") again();
      else if (e.key === "2") know();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, flip, again, know]);

  return {
    index,
    total,
    card,
    flipped,
    flip,
    next,
    prev,
    again,
    know,
    shuffle,
    toggleShuffle,
    handleExit,
  };
}
