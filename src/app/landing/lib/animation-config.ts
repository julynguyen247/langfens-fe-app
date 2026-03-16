export const EASE = {
  smooth: "power2.out",
  smoothInOut: "power2.inOut",
  snappy: "power3.out",
  bounce: "back.out(1.4)",
  elastic: "elastic.out(1, 0.5)",
} as const;

export const DURATION = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.0,
  xslow: 1.5,
} as const;

export const STAGGER = {
  tight: 0.05,
  normal: 0.1,
  relaxed: 0.15,
  wide: 0.2,
} as const;

export const SCROLL_TRIGGER_DEFAULTS = {
  start: "top 80%",
  end: "bottom 20%",
  toggleActions: "play none none reverse",
} as const;
