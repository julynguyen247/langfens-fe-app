import { NextRequest, NextResponse } from "next/server";
import stationsData from "@/data/stations.json";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "lofi";
  const records = stationsData as Record<string, unknown>;
  const data = records[key] || records["lofi"] || { ok: true, station: key, tracks: [] };
  return NextResponse.json(data);
}
