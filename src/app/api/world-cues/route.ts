import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    judge: "langfens-director-v1",
    cues: [
      { cue: "night", startSec: 0, endSec: 180, p: 0.95 },
      { cue: "rain", startSec: 30, endSec: 60, p: 0.8 }
    ],
    acts: [
      { action: "drop", atSec: 32 },
      { action: "peak", atSec: 96 }
    ],
    stanzas: []
  });
}
