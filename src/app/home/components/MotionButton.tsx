import { motion } from "framer-motion";
export function MotionButton({
  children,
  onClick,
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "light";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition";
  const solid = "bg-white text-[var(--skill-reading)] hover:bg-[var(--skill-reading-light)]";
  const light = "bg-white/10 text-white hover:bg-white/15";
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${base} ${variant === "solid" ? solid : light}`}
    >
      {children}
    </motion.button>
  );
}
