"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Full-screen loading overlay that displays for 2 seconds then fades out.
 * Shows a pulsing circle, animated progress bar, and loading text.
 */
export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: "var(--ocean-bg)" }}
        >
          <div className="flex flex-col items-center">
            {/* Pulsing circle */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-16 h-16 rounded-full"
              style={{
                border: "2px solid var(--ocean-primary)",
                boxShadow: "0 0 30px var(--ocean-primary-glow)",
              }}
            />

            {/* Progress bar */}
            <div
              className="w-48 h-1 rounded-full mt-8"
              style={{ backgroundColor: "var(--ocean-surface)" }}
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, var(--ocean-primary), var(--ocean-accent), var(--ocean-primary))',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                }}
              />
            </div>

            {/* Brand name */}
            <p className="text-lg font-bold text-[var(--ocean-text)] mt-6 tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
              Langfens
            </p>

            {/* Loading text */}
            <p className="text-sm font-medium tracking-wide text-[var(--ocean-text-muted)] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Almost there...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
