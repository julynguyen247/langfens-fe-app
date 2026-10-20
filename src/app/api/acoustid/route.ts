import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    match: {
      title: "English Audio Track",
      artist: "langfens",
      score: 0.99,
      mbid: "mbid-langfens-001"
    }
  });
}
