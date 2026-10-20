import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "IELTS Listening";

  return NextResponse.json({
    kind: "youtube#searchListResponse",
    items: [
      {
        id: { videoId: "hLOheGDwD_0" },
        snippet: { title: q, channelTitle: "langfens English" }
      }
    ]
  });
}
