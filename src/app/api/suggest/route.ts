import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const suggestions = [
    { title: `${q || 'IELTS Listening Practice'}`, artist: "langfens English", durationS: 240, explicit: false },
    { title: `${q || 'English Vocabulary Flow'}`, artist: "langfens Audio", durationS: 210, explicit: false },
    { title: `${q || 'Deep Focus Study Beats'}`, artist: "langfens Lounge", durationS: 280, explicit: false }
  ];
  return NextResponse.json({ ok: true, suggestions });
}
