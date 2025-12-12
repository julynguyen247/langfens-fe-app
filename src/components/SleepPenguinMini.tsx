"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function SleepPenguinMini() {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch("/animation/sleepPenguin.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
  }, []);

  if (!animationData) return null;

  return (
    <div className="w-10 h-10 flex items-center justify-center pointer-events-none bg-transparent">
      <Lottie animationData={animationData} loop autoplay />
    </div>
  );
}
