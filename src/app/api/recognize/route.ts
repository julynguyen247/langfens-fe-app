import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    acrId: "langfens:rec:001",
    offsetMs: 5000
  });
}
