import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "Cambridge IELTS Listening Test";

  return NextResponse.json({
    kind: "youtube#searchListResponse",
    items: [
      {
        id: { videoId: "DmV2oZaDcgg" },
        snippet: { title: q, channelTitle: "Langfens IELTS Academy" }
      }
    ]
  });
}
