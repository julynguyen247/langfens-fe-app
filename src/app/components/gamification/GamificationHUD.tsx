"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ProgressRing } from "./ProgressRing";
import type { DeviceTier } from "../effects/useDeviceCapability";

interface GamificationHUDProps {
  deviceTier: DeviceTier;
}

export function GamificationHUD({ deviceTier }: GamificationHUDProps) {
  const xpRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (deviceTier === "minimal" || !xpRef.current) return;

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: 2450,
      duration: 2,
      ease: "power2.out",
      delay: 1,
      onUpdate: () => {
        if (xpRef.current) {
          xpRef.current.textContent = Math.round(obj.val).toLocaleString();
        }
      },
    });

    return () => { tween.kill(); };
  }, [deviceTier]);

  if (deviceTier === "minimal") return null;

  const isReduced = deviceTier === "reduced";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className="fixed top-20 right-4 sm:right-6 z-50 pointer-events-none"
    >
      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
        <div className="flex items-center gap-1 bg-orange-500/15 border border-orange-400/30 rounded-full px-2.5 py-1 text-xs">
          <span className="flame-icon" aria-hidden="true" />
          <span className="text-orange-400 font-bold">7</span>
        </div>

        <div className="flex items-center gap-1 bg-[#FFD700]/10 border border-[#FFD700]/25 rounded-full px-2.5 py-1 text-xs">
          <span className="w-4 h-4 rounded-full bg-[#FFD700] border border-[#00E5FF]/40 flex items-center justify-center text-[6px] font-extrabold text-[#0A1625]">
            XP
          </span>
          <span ref={xpRef} className="text-[#FFD700] font-bold">
            0
          </span>
        </div>

        {!isReduced && (
          <div className="flex items-center gap-0.5 bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="css-heart"
                style={{ animationDelay: `${i * 0.15}s` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {!isReduced && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 2, stiffness: 300 }}
            className="bg-[#00E5FF]/15 border border-[#00E5FF]/30 rounded-full px-2.5 py-1 text-xs text-[#00E5FF] font-extrabold"
          >
            x3
          </motion.div>
        )}

        {!isReduced && <ProgressRing size={36} progress={73} />}
      </div>
    </motion.div>
  );
}
