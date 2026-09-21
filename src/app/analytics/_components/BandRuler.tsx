"use client";

import {
  BandRuler as SharedBandRuler,
  type BandRulerProps,
} from "@/components/ui/BandRuler";

export type { BandRulerProps } from "@/components/ui/BandRuler";

export function BandRuler(props: BandRulerProps) {
  return <SharedBandRuler {...props} labelFontFamily="var(--font-code)" />;
}

export default BandRuler;
