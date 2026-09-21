"use client";

import PenguinLottie from "@/components/PenguinLottie";
import { motion } from "framer-motion";

export function AuthBrandPanel({ description }: { description: string }) {
  return (
    <div className="lg:w-[40%] bg-[var(--primary-light)] flex flex-col items-center justify-center py-8 px-6 lg:py-0 lg:min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 lg:w-32 lg:h-32">
          <PenguinLottie />
        </div>
        <h2
          className="text-2xl lg:text-3xl font-bold text-[var(--primary-dark)] mt-4 text-center"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Langfens
        </h2>
        <p className="text-sm lg:text-base text-[var(--text-body)] mt-2 text-center max-w-xs">
          {description}
        </p>
      </motion.div>
    </div>
  );
}
