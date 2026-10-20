import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    title: "IELTS Focus Audio",
    artist: "langfens",
    confidence: 0.95
  });
}
