"use client";

import { useState, useEffect } from "react";
import { SkillsVisual } from "./SkillsVisual";
import { GradingVisual } from "./GradingVisual";
import { QuestionsVisual } from "./QuestionsVisual";
import { AnalyticsVisual } from "./AnalyticsVisual";
import { FlashcardsVisual } from "./FlashcardsVisual";
import { GamificationVisual } from "./GamificationVisual";

type FeatureVisualType =
  | "skills"
  | "grading"
  | "questions"
  | "analytics"
  | "flashcards"
  | "gamification";

interface FeatureVisualProps {
  type: FeatureVisualType;
}

export function FeatureVisual({ type }: FeatureVisualProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  switch (type) {
    case "skills":
      return <SkillsVisual />;
    case "grading":
      return <GradingVisual />;
    case "questions":
      return <QuestionsVisual />;
    case "analytics":
      return <AnalyticsVisual />;
    case "flashcards":
      return <FlashcardsVisual />;
    case "gamification":
      return <GamificationVisual />;
    default:
      return null;
  }
}
