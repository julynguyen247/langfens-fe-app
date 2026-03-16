"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLandingEffectsStore } from "../effects/useLandingEffectsStore";
import type { DeviceTier } from "../effects/useDeviceCapability";

interface MascotReactionsConfig {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  deviceTier: DeviceTier;
  onHover?: () => void;
  onClick?: () => void;
}

export function useMascotReactions({
  wrapperRef,
  deviceTier,
  onHover,
  onClick,
}: MascotReactionsConfig) {
  const gsapCtxRef = useRef<gsap.Context | null>(null);
  const floatTweenRef = useRef<gsap.core.Tween | null>(null);
  const isIdleAnimating = useRef(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || deviceTier === "minimal") return;

    const ctx = gsap.context(() => {
      floatTweenRef.current = gsap.to(el, {
        y: -8,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }, el);
    gsapCtxRef.current = ctx;

    if (deviceTier === "reduced") {
      return () => ctx.revert();
    }

    const handleMouseEnter = () => {
      gsap.to(el, {
        scale: 1.1,
        y: -12,
        duration: 0.2,
        ease: "back.out(2)",
        overwrite: "auto",
      });
      onHover?.();
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
      floatTweenRef.current?.restart();
    };

    const handleClick = () => {
      const tl = gsap.timeline();
      tl.to(el, { rotation: 360, duration: 0.6, ease: "power2.inOut" });
      tl.to(el, { scale: 1.15, duration: 0.15, ease: "back.out(3)" }, 0);
      tl.to(el, { scale: 1, rotation: 0, duration: 0.3, ease: "power2.out" });
      tl.call(() => floatTweenRef.current?.restart());
      onClick?.();
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("click", handleClick);

    const unsubIdle = useLandingEffectsStore.subscribe(
      (state) => state.isIdle,
      (isIdle) => {
        if (!el) return;
        if (isIdle && !isIdleAnimating.current) {
          isIdleAnimating.current = true;
          gsap.to(el, {
            keyframes: [
              { rotation: -3, duration: 0.4 },
              { rotation: 3, duration: 0.4 },
              { rotation: -2, duration: 0.3 },
              { rotation: 1, duration: 0.3 },
              { rotation: 0, duration: 0.2 },
            ],
            ease: "sine.inOut",
            repeat: -1,
            repeatDelay: 1,
          });
        } else if (!isIdle && isIdleAnimating.current) {
          gsap.killTweensOf(el, "rotation");
          gsap.to(el, { rotation: 0, duration: 0.3 });
          isIdleAnimating.current = false;
        }
      }
    );

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("click", handleClick);
      unsubIdle();
      ctx.revert();
    };
  }, [wrapperRef, deviceTier, onHover, onClick]);
}
