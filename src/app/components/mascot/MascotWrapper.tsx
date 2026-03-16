"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Lottie from "lottie-react";
import gsap from "gsap";
import { useMascotReactions } from "./useMascotReactions";
import { useLandingEffectsStore } from "../effects/useLandingEffectsStore";
import { useConfetti } from "../interactions/useConfetti";
import type { DeviceTier } from "../effects/useDeviceCapability";

interface MascotWrapperProps {
  deviceTier: DeviceTier;
  heroSectionRef: React.RefObject<HTMLElement | null>;
}

export function MascotWrapper({ deviceTier, heroSectionRef }: MascotWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const confetti = useConfetti(deviceTier);
  const isPeekingRef = useRef(false);

  const [activeData, setActiveData] = useState<object | null>(null);
  const [sleepData, setSleepData] = useState<object | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    fetch("/animation/penguin.json")
      .then((r) => r.json())
      .then(setActiveData)
      .catch(() => {});
    fetch("/animation/sleepPenguin.json")
      .then((r) => r.json())
      .then(setSleepData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (deviceTier !== "full" || !sleepData) return;

    const unsub = useLandingEffectsStore.subscribe(
      (state) => state.isIdle,
      (isIdle) => {
        const el = wrapperRef.current;
        if (!el) {
          setIsSleeping(isIdle);
          return;
        }
        gsap.to(el, {
          opacity: 0.3,
          duration: 0.3,
          onComplete: () => {
            setIsSleeping(isIdle);
            gsap.to(el, { opacity: 1, duration: 0.3 });
          },
        });
      }
    );
    return unsub;
  }, [deviceTier, sleepData]);

  useEffect(() => {
    if (deviceTier !== "full") return;
    const heroEl = heroSectionRef.current;
    const el = wrapperRef.current;
    if (!heroEl || !el) return;

    const originalPosition = el.style.position;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        useLandingEffectsStore.getState().setHeroInView(inView);

        if (!inView && !isPeekingRef.current) {
          isPeekingRef.current = true;
          el.style.position = "fixed";
          el.style.zIndex = "90";
          gsap.fromTo(
            el,
            { bottom: -100, right: 24, width: 80, height: 80 },
            { bottom: 24, duration: 0.5, ease: "back.out(1.5)" }
          );
        } else if (inView && isPeekingRef.current) {
          isPeekingRef.current = false;
          gsap.to(el, {
            bottom: -100,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
              el.style.position = originalPosition || "";
              el.style.zIndex = "";
              el.style.bottom = "";
              el.style.right = "";
              el.style.width = "";
              el.style.height = "";
              gsap.set(el, { clearProps: "bottom,right,width,height" });
            },
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, [deviceTier, heroSectionRef]);

  const handleHover = useCallback(() => {
    confetti.small();
  }, [confetti]);

  const handleClick = useCallback(() => {
    confetti.celebration();
  }, [confetti]);

  useMascotReactions({
    wrapperRef,
    deviceTier,
    onHover: handleHover,
    onClick: handleClick,
  });

  const currentData = isSleeping && sleepData ? sleepData : activeData;
  if (!currentData) return <div className="w-64 h-64 sm:w-80 sm:h-80" />;

  return (
    <div
      ref={wrapperRef}
      className="w-64 h-64 sm:w-80 sm:h-80 cursor-pointer"
    >
      <Lottie animationData={currentData} loop autoplay />
    </div>
  );
}
