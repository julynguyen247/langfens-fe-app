"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function PenguinLottie() {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch("/animation/penguin.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
  }, []);

  if (!animationData) return null;

  return (
    <div className="w-24 h-24 sm:w-28 sm:h-28">
      <Lottie animationData={animationData} loop autoplay />
    </div>
  );
}
