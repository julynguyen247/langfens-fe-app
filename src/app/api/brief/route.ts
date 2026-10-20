import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "Study Track";
  const artist = searchParams.get("artist") || "langfens";
  const brief = {
    genres: ["electronic", "ambient", "focus", "study"],
    character: "groove",
    vibe: `An inspiring, rhythmic English study session for ${name} by ${artist}.`,
    energyArc: "A steady focus groove maintaining high concentration throughout.",
    language: "english",
    confidence: 1.0,
    dominantVocals: "sung",
    sadOrLonely: false,
    allTimeBanger: true,
    bpm: 118,
    chantAnthem: false,
    daypart: "night",
    moves: {
      fit: [
        "pose_to_luckyDance",
        "pose_to_WaveDance",
        "pose_to_HypeDance",
        "pose_to_ElasticDance",
        "bop_hard"
      ]
    }
  };
  return NextResponse.json({ brief });
}
