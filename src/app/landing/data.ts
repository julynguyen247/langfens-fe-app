/* ═══════════════════════════════════════════════════════
   LANDING PAGE CONTENT — English only
   All text content for the cinematic ocean landing page
   ═══════════════════════════════════════════════════════ */

export const NAV_LINKS = [
  { label: "Features", target: "features" },
  { label: "How It Works", target: "how-it-works" },
  { label: "Reviews", target: "testimonials" },
] as const;

export const HERO = {
  preHeadline: "AI-POWERED IELTS PREPARATION",
  headline: "Master IELTS",
  headlineAccent: "With Confidence",
  subtitle:
    "Smart practice with AI grading, detailed analytics, and gamification that makes studying addictive. Conquer your dream band score with your penguin companion.",
  socialProof: "4.8/5 from 2,000+ students",
  ctaPrimary: "Start Free",
  ctaSecondary: "Watch Demo",
  ctaNote: "Free forever. No credit card required.",
} as const;

export const FEATURES = [
  {
    number: "01",
    label: "ALL 4 IELTS SKILLS",
    title: "Practice Every Skill That Matters",
    description:
      "Reading, Listening, Writing, Speaking — complete practice tests matching the latest official IELTS format. No shortcuts, no gaps.",
    cta: "Try Reading Test",
  },
  {
    number: "02",
    label: "AI AUTO-GRADING",
    title: "Your AI Examiner, Available 24/7",
    description:
      "Writing and Speaking graded instantly by advanced AI. Get detailed, criterion-by-criterion feedback that shows exactly how to improve.",
    cta: "See AI Feedback",
  },
  {
    number: "03",
    label: "20+ QUESTION TYPES",
    title: "Train for Every Curveball",
    description:
      "True/False/Not Given, Matching, Completion, Flow Chart, and more — covering every question type you'll face on exam day.",
    cta: "Browse Questions",
  },
  {
    number: "04",
    label: "ANALYTICS & BAND PREDICTION",
    title: "Know Exactly Where You Stand",
    description:
      "Detailed dashboard showing your strengths, weaknesses, progress trends, and predicted band score. Data-driven preparation.",
    cta: "View Dashboard",
  },
  {
    number: "05",
    label: "FLASHCARDS & VOCABULARY",
    title: "Build a Vocabulary That Sticks",
    description:
      "Create personal flashcard decks or use community sets. Spaced repetition system ensures long-term retention.",
    cta: "Start Flashcards",
  },
  {
    number: "06",
    label: "GAMIFICATION",
    title: "Level Up Every Day",
    description:
      "XP, streaks, achievements, and leaderboards turn exam prep into an addictive game. Compete, progress, and have fun.",
    cta: "See Leaderboard",
  },
] as const;

export const STEPS = [
  {
    number: "01",
    title: "Create Account",
    description:
      "Sign up for free in under a minute. Your journey begins now.",
  },
  {
    number: "02",
    title: "Choose Your Test",
    description:
      "Browse our diverse test library, always updated to the latest IELTS format.",
  },
  {
    number: "03",
    title: "Practice & Get Results",
    description:
      "Auto-grading with detailed analysis of your strengths and weaknesses.",
  },
] as const;

export const STATS = [
  {
    value: 3200,
    suffix: "+",
    label: "Tests Completed",
    sublabel: "In just 6 months of operation",
  },
  {
    value: 75,
    suffix: "%",
    label: "First-Attempt Pass Rate",
    sublabel: "Students passing their real IELTS exam on the first try",
  },
  {
    value: 80,
    suffix: "%",
    label: "2+ Band Improvement",
    sublabel: "Students improving at least 2 bands within 10 weeks",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Langfens helped me go from 5.5 to 7.0 in 2 months. The AI Writing feedback is incredibly detailed!",
    name: "Minh Anh",
    score: "IELTS 7.0",
    stars: 5,
  },
  {
    quote:
      "I love the gamification system — streaks and XP keep me practicing every single day.",
    name: "Thu Ha",
    score: "IELTS 6.5",
    stars: 5,
  },
  {
    quote:
      "Integrated flashcards and dictionary while doing tests helped me learn vocabulary so much faster.",
    name: "Duc Anh",
    score: "IELTS 7.5",
    stars: 5,
  },
] as const;

export const CTA = {
  label: "READY?",
  headline: "Ready to Conquer Your Dream Band?",
  subtitle:
    "Start practicing today. Track your progress with AI-powered insights. It's free.",
  ctaPrimary: "Start Free",
  ctaSecondary: "Contact Us",
  note: "Free forever. No credit card required.",
} as const;

export const FOOTER = {
  tagline: "AI-powered IELTS preparation platform.",
  links: [
    { label: "About Us", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  copyright: `\u00A9 ${new Date().getFullYear()} Langfens. All rights reserved.`,
} as const;
