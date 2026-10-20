import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const op = searchParams.get("op");
  const q = searchParams.get("q") || "Study Track";

  if (op === "search") {
    return NextResponse.json({
      ok: true,
      tracks: [
        {
          urn: "soundcloud:tracks:254112221",
          title: q,
          artist: "langfens Learning",
          durationMs: 240000,
          access: "playable",
          artworkUrl: "/ui/cover.jpg",
          plays: 500000,
          genre: "Focus"
        }
      ]
    });
  }

  if (op === "resolve") {
    return NextResponse.json({
      ok: true,
      track: {
        urn: "soundcloud:tracks:254112221",
        title: "Resolved Track",
        artist: "langfens Learning",
        durationMs: 240000,
        access: "playable"
      }
    });
  }

  return NextResponse.json({ ok: true });
}
