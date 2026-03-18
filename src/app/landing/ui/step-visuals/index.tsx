"use client";

import { StepVisual01 } from "./StepVisual01";
import { StepVisual02 } from "./StepVisual02";
import { StepVisual03 } from "./StepVisual03";

export function StepVisual({ stepNumber }: { stepNumber: string }) {
  switch (stepNumber) {
    case "01":
      return <StepVisual01 />;
    case "02":
      return <StepVisual02 />;
    case "03":
      return <StepVisual03 />;
    default:
      return null;
  }
}
