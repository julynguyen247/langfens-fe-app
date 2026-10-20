import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const suggestions = [
    { title: `${q || 'Cambridge IELTS 19 Listening Test'}`, artist: "Cambridge English", durationS: 1800, explicit: false },
    { title: `${q || 'BBC 6 Minute English Vocabulary'}`, artist: "BBC Learning English", durationS: 360, explicit: false },
    { title: `${q || 'TED-Ed Academic Listening Lecture'}`, artist: "TED-Ed", durationS: 310, explicit: false },
    { title: `${q || 'IELTS Speaking & Listening Practice'}`, artist: "Langfens Academy", durationS: 600, explicit: false },
    { title: `${q || 'Deep Focus Study Ambience'}`, artist: "Langfens Lounge", durationS: 1800, explicit: false }
  ];
  return NextResponse.json({ ok: true, suggestions });
}
