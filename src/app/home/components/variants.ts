export const staggerContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export const staggerBar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export function barItem(h: number) {
  return {
    hidden: { height: 0, opacity: 0 },
    show: { height: `${h}%`, opacity: 1, transition: { duration: 0.5 } },
  };
}
